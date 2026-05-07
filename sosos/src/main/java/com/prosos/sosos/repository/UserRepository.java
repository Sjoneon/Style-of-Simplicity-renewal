package com.prosos.sosos.repository;

import com.prosos.sosos.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // 이메일 기준 사용자 조회
    User findByEmail(String email);
}
