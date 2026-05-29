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
    public ResponseEntity <Map<String, String>>method (@RequestParam MultipartFile file) throws IOException {
        String fileName = file.getOriginalFilename();
        String extension = FilenameUtils.getExtension(fileName);
        String uniqueFilename = UUID.randomUUID().toString() + "." + extension;
        Path targetDirectory = Paths.get("uploads");
        Files.createDirectories(targetDirectory);
        Path targetPath = targetDirectory.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        String url = "http://localhost:8080/uploads/" + uniqueFilename;
        return ResponseEntity.ok(Map.of("url", url));
    }
}
