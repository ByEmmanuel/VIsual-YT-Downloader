package Controllers;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/Download")
@CrossOrigin(origins = "*") // Asegúrate de configurar esto apropiadamente en producción
public class VideoDownloader {

    @GetMapping("/HolaMundo")
    public String redirectToIndex() {
        return "Hola Mundo";
    }


    @Value("${video.download.path}")
    private String downloadPath;

    @Data
    public static class VideoRequest {
        private String url;
    }


    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> downloadVideo(@RequestBody VideoRequest request) {
        try {
            // Crear directorio temporal
            Path tempDir = Files.createTempDirectory("video_download");
            String fileName = UUID.randomUUID().toString() + ".mp4";
            Path tempFile = tempDir.resolve(fileName);

            // Configurar yt-dlp para usar el directorio temporal
            ProcessBuilder processBuilder = new ProcessBuilder(
                    "yt-dlp",
                    "-f", "best",
                    "-o", tempFile.toString(),
                    "--merge-output-format", "mp4",
                    request.getUrl()
            );

            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();

            if (!process.waitFor(5, TimeUnit.MINUTES)) {
                process.destroyForcibly();
                throw new Exception("Timeout al descargar el video");
            }

            if (process.exitValue() != 0) {
                throw new Exception("Error al descargar el video");
            }

            // Leer archivo y preparar respuesta
            byte[] videoData = Files.readAllBytes(tempFile);
            ByteArrayResource resource = new ByteArrayResource(videoData);

            // Limpiar archivos temporales
            Files.delete(tempFile);
            Files.delete(tempDir);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + fileName + "\"")
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }

    private String downloadVideoFile(String url, String fileName) throws Exception {
        File directory = new File(downloadPath);
        if (!directory.exists()) {
            directory.mkdirs();
        }

        String outputPath = downloadPath + File.separator + fileName;

        ProcessBuilder processBuilder = new ProcessBuilder(
                "yt-dlp",
                "-f", "best",
                "-o", outputPath,
                "--merge-output-format", "mp4",
                url
        );

        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();

        boolean completed = process.waitFor(5, TimeUnit.MINUTES);

        if (!completed) {
            process.destroyForcibly();
            throw new Exception("Timeout al descargar el video");
        }

        if (process.exitValue() != 0) {
            throw new Exception("Error al descargar el video");
        }

        return outputPath;
    }


}

