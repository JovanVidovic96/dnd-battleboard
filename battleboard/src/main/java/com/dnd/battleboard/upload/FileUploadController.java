package com.dnd.battleboard.upload;

import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("api/upload")
@RequiredArgsConstructor

public class FileUploadController {

    @PostMapping
    public ResponseEntity<Map<String, String>> upload(@RequestParam MultipartFile file) throws IOException {
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
        String extension = FilenameUtils.getExtension(originalName);
        String uniqueFilename = UUID.randomUUID() + (extension.isEmpty() ? "" : "." + extension);
        Path targetDirectory = Paths.get("uploads");
        Files.createDirectories(targetDirectory);
        Files.copy(file.getInputStream(), targetDirectory.resolve(uniqueFilename), StandardCopyOption.REPLACE_EXISTING);
        String url = "/uploads/" + uniqueFilename;
        return ResponseEntity.ok(Map.of("url", url));
    }
}
