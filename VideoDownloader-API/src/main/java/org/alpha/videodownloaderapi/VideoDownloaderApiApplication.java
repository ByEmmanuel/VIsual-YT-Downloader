package org.alpha.videodownloaderapi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Controller;

@SpringBootApplication
@ComponentScan(basePackages = "Controllers")
public class VideoDownloaderApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(VideoDownloaderApiApplication.class, args);
    }

}
