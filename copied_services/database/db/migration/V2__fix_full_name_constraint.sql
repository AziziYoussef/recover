-- Fix the full_name field constraint and update existing data

-- Step 1: Update existing admin user to have proper full_name
UPDATE users 
SET full_name = CASE 
    WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN CONCAT(first_name, ' ', last_name)
    WHEN first_name IS NOT NULL THEN first_name
    WHEN last_name IS NOT NULL THEN last_name
    ELSE username
END
WHERE full_name IS NULL OR full_name = '';

-- Step 2: Make the full_name column nullable to prevent future constraint violations
ALTER TABLE users MODIFY COLUMN full_name VARCHAR(100) NULL;