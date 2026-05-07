package com.prosos.sosos.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
// 비밀번호 해시 전략을 한 곳에서 주입하기 위한 설정 클래스다.
public class PasswordConfig {

    @Bean
    // 로그인/회원가입 시 동일한 BCrypt 인코더를 재사용한다.
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
