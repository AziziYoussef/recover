// Add this method to UserController.java
// This allows profile updates via email identification instead of JWT authentication

@PutMapping("/profile-by-email")
public ResponseEntity<?> updateUserProfileByEmail(@RequestBody Map<String, String> updates) {
    try {
        // Get email from the request body
        String email = updates.get("email");
        if (email == null || email.isEmpty()) {
            return new ResponseEntity<>("Email is required", HttpStatus.BAD_REQUEST);
        }

        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        // Update profile fields
        if (updates.containsKey("firstName")) {
            user.setFirstName(updates.get("firstName"));
        }
        
        if (updates.containsKey("lastName")) {
            user.setLastName(updates.get("lastName"));
        }
        
        if (updates.containsKey("phone")) {
            user.setPhone(updates.get("phone"));
        }
        
        if (updates.containsKey("bio")) {
            user.setBio(updates.get("bio"));
        }
        
        if (updates.containsKey("address")) {
            user.setAddress(updates.get("address"));
        }
        
        if (updates.containsKey("avatarUrl")) {
            user.setAvatarUrl(updates.get("avatarUrl"));
        }

        // Save updated user
        userRepository.save(user);
        
        // Return success response
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Profile updated successfully");
        response.put("user", user);
        
        return new ResponseEntity<>(response, HttpStatus.OK);
        
    } catch (Exception e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", e.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}