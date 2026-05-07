package com.prosos.sosos.repository;

import com.prosos.sosos.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    // 카테고리명 기준 단건 조회
    Optional<Category> findByName(String name);
}
