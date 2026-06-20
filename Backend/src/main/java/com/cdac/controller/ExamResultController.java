package com.cdac.controller;


import com.cdac.dto.ExamResultRequest;
import com.cdac.dto.ExamResultResponse;
import com.cdac.security.JwtUtils;
import com.cdac.service.ExamResultService;
import com.cdac.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/exam-results")
@RequiredArgsConstructor
public class ExamResultController {

    private final ExamResultService examResultService;

    /**
     * POST /exam-results/submit
     * Called after student finishes an exam.
     * Requires: Bearer token (student)
     */
    @PostMapping("/submit")
    public ResponseEntity<ExamResultResponse> submitResult(
            @Valid @RequestBody ExamResultRequest dto,
            Authentication authentication) {
        String email = authentication.getName();
        ExamResultResponse saved = examResultService.saveResult(email, dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * GET /exam-results/my-history
     * Returns all past attempts for the logged-in user.
     */
    @GetMapping("/my-history")
    public ResponseEntity<List<ExamResultResponse>> getMyHistory(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(examResultService.getResultsByUser(email));
    }

    /**
     * GET /exam-results/my-history/{subject}
     * Returns attempts for a specific subject.
     */
    @GetMapping("/my-history/{subject}")
    public ResponseEntity<List<ExamResultResponse>> getMyHistoryBySubject(
            @PathVariable String subject,
            Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(examResultService.getResultsByUserAndSubject(email, subject));
    }
}
