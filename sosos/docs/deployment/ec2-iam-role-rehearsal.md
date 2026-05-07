# EC2 + IAM Role 리허설 절차 (2026-04-27)

## 목적
- EC2 인스턴스가 Access Key 없이 IAM Role만으로 S3 업로드를 수행하는지 검증한다.
- 배포 전 권한/환경변수/CORS 설정 누락을 사전에 발견한다.

## 리허설 완료 기준
- EC2에서 백엔드가 `APP_STORAGE_TYPE=s3`로 정상 기동한다.
- 스모크 테스트 업로드가 성공하고 테스트 객체 삭제까지 완료된다.
- 로그에 `Unable to load credentials` 또는 `AccessDenied`가 없다.

## 사전 준비
- IAM 정책에 최소 권한 포함
  - `s3:PutObject`
  - `s3:GetObject`
  - `s3:DeleteObject`
  - `s3:ListBucket`
- EC2 인스턴스 프로파일에 위 IAM Role 연결
- 보안그룹에서 백엔드 포트(`8085`) 허용 범위 확인
- EC2 내 Java 17, Git, Maven 실행 가능 상태 확인

## 리허설 단계
1. EC2 접속 후 Role 연결 확인
```bash
TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -sH "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

2. 코드 배포/빌드
```bash
git clone <repo-url>
cd Style-of-Simplicity/sosos
./mvnw -DskipTests compile
```

3. 환경변수 주입 (예시)
```bash
export SPRING_PROFILES_ACTIVE=prod
export DB_URL=jdbc:mysql://<rds-endpoint>:3306/SOS_db
export DB_USERNAME=<db-user>
export DB_PASSWORD=<db-password>
export APP_CORS_ALLOWED_ORIGINS=https://style-of-simplicity.com
export APP_STORAGE_TYPE=s3
export APP_STORAGE_S3_BUCKET=<bucket-name>
export APP_STORAGE_S3_REGION=ap-northeast-2
export APP_STORAGE_S3_PREFIX=sosos
```

3-1. 배포 전 DB 마이그레이션 선반영
```sql
-- docs/deployment/sql/2026-04-29-sale-wishlist.sql 실행
-- (세일 original_price, wishlist_items 보강)
```
참고 문서:
- `docs/deployment/db-migration-sale-wishlist.md`

4. 백엔드 기동
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=prod
```

5. S3 실업로드 스모크 테스트 실행
```bash
export RUN_S3_SMOKE_TEST=true
./mvnw -Dtest=S3CredentialSmokeTest test
```

6. 결과 확인
- 테스트 로그 `BUILD SUCCESS` 확인
- S3 버킷에서 smoke-test 객체 생성/삭제 이력 확인
- 백엔드 로그에서 자격증명/권한 오류 부재 확인

## 실패 시 점검 순서
1. `APP_STORAGE_S3_BUCKET` 오타 여부
2. EC2 Role 부착 여부(인스턴스 프로파일)
3. 버킷 정책의 Principal/Resource 범위
4. Role 정책에 `Put/Get/Delete/List` 포함 여부
5. 리전 불일치 여부(`APP_STORAGE_S3_REGION`)
