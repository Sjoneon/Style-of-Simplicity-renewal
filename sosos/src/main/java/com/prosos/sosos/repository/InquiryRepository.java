package com.prosos.sosos.repository;

import com.prosos.sosos.model.Inquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InquiryRepository extends JpaRepository<Inquiry, Long> {
    // 사용자 기준 문의 목록 조회
    List<Inquiry> findByUserId(Long userId);

    // 미답변 문의 목록 조회
    List<Inquiry> findByAnswerIsNull();

    void deleteByProductId(Long productId);
}
