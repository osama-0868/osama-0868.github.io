import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Checks every http(s) link in index.html and reports which ones fail.
 *
 * Needs Java 11 or newer. From the project folder, run:
 *
 *     java tools/LinkChecker.java index.html
 *
 * Exit code is 1 if any link is broken, so it can also run in a CI job.
 */
public class LinkChecker {

    private static final Pattern HREF = Pattern.compile("href=\"(https?://[^\"#]+)");
    private static final Set<String> SKIP_HOSTS = Set.of("fonts.googleapis.com", "fonts.gstatic.com");

    public static void main(String[] args) throws Exception {
        Path file = Path.of(args.length > 0 ? args[0] : "index.html");
        String html = Files.readString(file);

        Set<String> links = new LinkedHashSet<>();
        Matcher matcher = HREF.matcher(html);
        while (matcher.find()) {
            String url = matcher.group(1);
            String host = URI.create(url).getHost();
            if (host != null && !SKIP_HOSTS.contains(host)) {
                links.add(url);
            }
        }

        HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(8))
                .build();

        System.out.println("Checking " + links.size() + " links in " + file + "\n");

        int broken = 0;
        for (String url : links) {
            String result = check(client, url);
            boolean ok = result.startsWith("OK") || result.startsWith("BLOCKED");
            if (!ok) {
                broken++;
            }
            System.out.printf("%-8s %s%n", ok ? "ok" : "BROKEN", url + "  (" + result + ")");
        }

        System.out.println();
        System.out.println(broken == 0 ? "All links work." : broken + " broken link(s). Fix them in content.py and rebuild.");
        System.exit(broken == 0 ? 0 : 1);
    }

    private static String check(HttpClient client, String url) {
        try {
            int status = send(client, url, "HEAD");
            if (status == 405 || status == 403 || status == 400) {
                status = send(client, url, "GET");
            }
            if (status >= 200 && status < 400) {
                return "OK " + status;
            }
            // LinkedIn answers bots with 999 even for healthy profiles.
            if (status == 999) {
                return "BLOCKED " + status + ", open it in a browser to confirm";
            }
            return "HTTP " + status;
        } catch (Exception e) {
            return "failed: " + e.getClass().getSimpleName();
        }
    }

    private static int send(HttpClient client, String url, String method) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(10))
                .header("User-Agent", "Mozilla/5.0 (portfolio LinkChecker)")
                .method(method, HttpRequest.BodyPublishers.noBody())
                .build();
        return client.send(request, HttpResponse.BodyHandlers.discarding()).statusCode();
    }
}
