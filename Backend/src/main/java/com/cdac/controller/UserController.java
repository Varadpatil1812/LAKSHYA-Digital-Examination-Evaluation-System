package com.cdac.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.cdac.dao.UserDao;
import com.cdac.dto.AuthResponse;
import com.cdac.dto.UserResp;
import com.cdac.dto.UserSignInRequest;
import com.cdac.dto.UserSignupRequest;
import com.cdac.entities.UserRole;
import com.cdac.security.JwtUtils;
import com.cdac.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

import org.modelmapper.ModelMapper;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtils jwtUtils;

    @PostMapping("/signup")
    public ResponseEntity<?> userSignUp(@RequestBody @Valid UserSignupRequest dto) {
        System.out.println("in user sign up " + dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.registerNewUser(dto));
    }

    @PostMapping("/signin")
    public ResponseEntity<?> userSignIn(@RequestBody @Valid UserSignInRequest dto) {
        System.out.println("in user sign in " + dto);
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getPassword());
        Authentication successAuth = authenticationManager.authenticate(authToken);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthResponse("Successful Authentication...",
                        jwtUtils.generateJwtToken(successAuth)));
    }


}
