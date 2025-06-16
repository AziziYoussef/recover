package com.recovr.api.service;

import com.recovr.api.dto.AdminDashboardDto;
import com.recovr.api.dto.ItemDto;
import com.recovr.api.dto.UserDto;
import com.recovr.api.entity.Item;
import com.recovr.api.entity.ItemCategory;
import com.recovr.api.entity.ItemStatus;
import com.recovr.api.entity.User;
import com.recovr.api.repository.ItemRepository;
import com.recovr.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ItemService itemService;

    @Transactional(readOnly = true)
    public AdminDashboardDto getAdminDashboard() {
         AdminDashboardDto dashboard = new AdminDashboardDto();
         dashboard.setTotalItems(itemRepository.count());
         dashboard.setTotalUsers(userRepository.count());
         Map<String, Long> statusMap = new HashMap<>();
         for (ItemStatus status : ItemStatus.values()) {
             statusMap.put(status.name(), itemRepository.countByStatus(status));
         }
         dashboard.setItemsByStatus(statusMap);
         Map<String, Long> categoryMap = new HashMap<>();
         for (ItemCategory cat : ItemCategory.values()) {
             categoryMap.put(cat.name(), itemRepository.countByCategory(cat));
         }
         dashboard.setItemsByCategory(categoryMap);
         dashboard.setTotalAbandoned(itemRepository.countByStatus(ItemStatus.ABANDONED));
         dashboard.setTotalClaimed(itemRepository.countByStatus(ItemStatus.CLAIMED));
         dashboard.setTotalReturned(itemRepository.countByStatus(ItemStatus.RETURNED));
         return dashboard;
    }

    @Transactional(readOnly = true)
    public List<ItemDto> getAllItemsAdmin() {
         List<Item> items = itemRepository.findAll();
         return items.stream().map(itemService::convertToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsersAdmin() {
         List<User> users = userRepository.findAll();
         return users.stream().map(this::convertToUserDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteItemAdmin(Long id) {
         if (!itemRepository.existsById(id)) { throw new RuntimeException("Item not found"); }
         itemRepository.deleteById(id);
    }

    @Transactional
    public void deleteUserAdmin(Long id) {
         if (!userRepository.existsById(id)) { throw new RuntimeException("User not found"); }
         userRepository.deleteById(id);
    }

    @Transactional
    public ItemDto updateItemAdmin(Long id, ItemDto itemDto) {
         Item item = itemRepository.findById(id).orElseThrow(() -> new RuntimeException("Item not found"));
         itemService.updateItemFromDto(item, itemDto);
         Item savedItem = itemRepository.save(item);
         return itemService.convertToDto(savedItem);
    }

    @Transactional
    public UserDto updateUserAdmin(Long id, UserDto userDto) {
         User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
         user.setUsername(userDto.getUsername());
         user.setEmail(userDto.getEmail());
         // (Si vous avez une logique de mise à jour des rôles, vous pouvez l'ajouter ici)
         User savedUser = userRepository.save(user);
         return convertToUserDto(savedUser);
    }

    private UserDto convertToUserDto(User user) {
         UserDto dto = new UserDto();
         dto.setId(user.getId());
         dto.setUsername(user.getUsername());
         dto.setEmail(user.getEmail());
         // (Si vous avez une logique pour convertir les rôles, vous pouvez l'ajouter ici)
         return dto;
    }

} 