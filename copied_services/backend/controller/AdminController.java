package com.recovr.api.controller;

import com.recovr.api.dto.AdminDashboardDto;
import com.recovr.api.dto.ItemDto;
import com.recovr.api.dto.UserDto;
import com.recovr.api.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@Tag(name = "Admin", description = "Admin dashboard endpoints")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard statistics", description = "Returns statistics for the admin dashboard.")
    public ResponseEntity<AdminDashboardDto> getAdminDashboard() {
        AdminDashboardDto dashboard = adminService.getAdminDashboard();
        return ResponseEntity.ok(dashboard);
    }

    @GetMapping("/items")
    @Operation(summary = "Get all items (admin)", description = "Retrieves the list of all items for administration.")
    public ResponseEntity<List<ItemDto>> getAllItemsAdmin() {
        List<ItemDto> items = adminService.getAllItemsAdmin();
        return ResponseEntity.ok(items);
    }

    @GetMapping("/users")
    @Operation(summary = "Get all users (admin)", description = "Retrieves the list of all users for administration.")
    public ResponseEntity<List<UserDto>> getAllUsersAdmin() {
        List<UserDto> users = adminService.getAllUsersAdmin();
        return ResponseEntity.ok(users);
    }

    @DeleteMapping("/items/{id}")
    @Operation(summary = "Delete an item (admin)", description = "Deletes an item by its ID for administration.")
    public ResponseEntity<Void> deleteItemAdmin(@PathVariable Long id) {
        adminService.deleteItemAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}")
    @Operation(summary = "Delete a user (admin)", description = "Deletes a user by its ID for administration.")
    public ResponseEntity<Void> deleteUserAdmin(@PathVariable Long id) {
        adminService.deleteUserAdmin(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/items/{id}")
    @Operation(summary = "Update an item (admin)", description = "Updates an item by its ID for administration.")
    public ResponseEntity<ItemDto> updateItemAdmin(@PathVariable Long id, @RequestBody ItemDto itemDto) {
        ItemDto updated = adminService.updateItemAdmin(id, itemDto);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/users/{id}")
    @Operation(summary = "Update a user (admin)", description = "Updates a user by its ID for administration.")
    public ResponseEntity<UserDto> updateUserAdmin(@PathVariable Long id, @RequestBody UserDto userDto) {
        UserDto updated = adminService.updateUserAdmin(id, userDto);
        return ResponseEntity.ok(updated);
    }
}