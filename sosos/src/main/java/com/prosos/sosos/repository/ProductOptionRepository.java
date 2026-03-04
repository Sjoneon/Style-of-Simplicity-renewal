package com.prosos.sosos.repository;

import com.prosos.sosos.model.ProductOption;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductOptionRepository extends JpaRepository<ProductOption, Long> {

    List<ProductOption> findByProductIdOrderByDisplayOrderAscIdAsc(Long productId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select po from ProductOption po where po.id = :id")
    Optional<ProductOption> findByIdForUpdate(@Param("id") Long id);
}
