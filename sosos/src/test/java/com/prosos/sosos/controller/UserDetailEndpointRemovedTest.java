package com.prosos.sosos.controller;

import com.prosos.sosos.controller.api.v1.UserApiController;
import com.prosos.sosos.model.User;
import com.prosos.sosos.service.RecentProductViewService;
import com.prosos.sosos.service.SellerService;
import com.prosos.sosos.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// ID만으로 다른 사용자 개인정보를 조회하던 경로가 다시 생기지 않도록 막는다.
class UserDetailEndpointRemovedTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        UserService userService = mock(UserService.class);
        User user = new User();
        user.setId(1L);
        when(userService.findUserById(anyLong())).thenReturn(user);

        mockMvc = MockMvcBuilders.standaloneSetup(
                new UserApiController(userService, mock(SellerService.class), mock(RecentProductViewService.class))
        ).build();
    }

    @Test
    void apiUserDetailByIdIsNotExposed() throws Exception {
        mockMvc.perform(get("/api/v1/users/1")).andExpect(status().isNotFound());
    }
}
