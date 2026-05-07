package com.prosos.sosos.repository;

import com.prosos.sosos.model.Keyword;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KeywordRepository extends JpaRepository<Keyword, Long> {
    // 키워드명 기준 단건 조회
    Optional<Keyword> findByKeyword(String keyword);
}
