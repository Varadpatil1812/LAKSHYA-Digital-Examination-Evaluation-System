package com.cdac.security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JWTCustomFilter extends OncePerRequestFilter {
	// verify JWT
	// depcy - JwtUtils
	private final JwtUtils jwtUtils;
	private final UserDetailsService userDetailsService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {
		// Check for authorization req header
		String headerValue = request.getHeader("Authorization");
		// checking for not null n extract JWT
		if (headerValue != null && headerValue.startsWith("Bearer ")) {
			//jwt - present , extract JWT
			String jwt = headerValue.substring(7);
			// verify the token using JWT utils class
			String username = jwtUtils.getUserNameFromJwtToken(jwtUtils.validateJwtToken(jwt));

			UserDetails userDetails = userDetailsService.loadUserByUsername(username);
			
				UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
						userDetails, null, userDetails.getAuthorities() // roles from DB, not token
				);
				System.out.println("auth obj in filter " + authentication);
				SecurityContextHolder.getContext().setAuthentication(authentication);
			
		}
		// to continue with remaining filter chain sequence
		filterChain.doFilter(request, response);

	}

}
