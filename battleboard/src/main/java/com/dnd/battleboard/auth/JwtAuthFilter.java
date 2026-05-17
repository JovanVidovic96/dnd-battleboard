package com.dnd.battleboard.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@AllArgsConstructor
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
       String authHeader =  request.getHeader("Authorization");
       if (authHeader == null || !authHeader.startsWith("Bearer ")) {
           filterChain.doFilter(request, response);
           return;
       }
       String token = authHeader.substring(7);
       String username = jwtService.extractUsername(token);

       if (username!= null && jwtService.isTokenValid(token)) {
           UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                   username, null, new ArrayList<>()
           );
           SecurityContextHolder.getContext().setAuthentication(authToken);
       }
       filterChain.doFilter(request, response);
    }
}
