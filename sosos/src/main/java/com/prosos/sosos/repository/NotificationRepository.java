package com.prosos.sosos.repository;

import com.prosos.sosos.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // 사용자 알림 최신순 조회
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 사용자 소유 알림 단건 조회
    Optional<Notification> findByIdAndUserId(Long notificationId, Long userId);

    // 사용자 알림 전체 건수 조회
    long countByUserId(Long userId);

    // 사용자 미읽음 건수 조회
    long countByUserIdAndReadFalse(Long userId);

    // 사용자 알림 유형별 건수 조회
    long countByUserIdAndType(Long userId, String type);

    // 사용자 알림 전체 읽음 처리
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update Notification n set n.read = true where n.user.id = :userId and n.read = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);
}
