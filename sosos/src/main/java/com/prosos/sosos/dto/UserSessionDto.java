package com.prosos.sosos.dto;

import com.prosos.sosos.model.Seller;
import com.prosos.sosos.model.User;

public class UserSessionDto {

    private String userType;
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private String businessNumber;

    public UserSessionDto() {
    }

    public static UserSessionDto fromUser(User user) {
        UserSessionDto dto = new UserSessionDto();
        dto.setUserType("user");
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        return dto;
    }

    public static UserSessionDto fromSeller(Seller seller) {
        UserSessionDto dto = new UserSessionDto();
        dto.setUserType("seller");
        dto.setId(seller.getId());
        dto.setName(seller.getName());
        dto.setBusinessNumber(seller.getBusinessNumber());
        return dto;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getBusinessNumber() {
        return businessNumber;
    }

    public void setBusinessNumber(String businessNumber) {
        this.businessNumber = businessNumber;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }
}
