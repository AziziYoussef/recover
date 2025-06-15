# Development Guide - Hot Reload Setup

This guide shows you how to set up automatic hot reload for the RECOVR Spring Boot backend, so you never need to manually restart the server again!

## 🚀 Quick Start

### 1. Start with Hot Reload

Instead of the regular Maven command, use our development script:

```bash
cd spring-backend
./start-dev.sh
```

This starts Spring Boot with:
- ✅ Automatic restart on code changes
- ✅ LiveReload for browser refresh
- ✅ Enhanced logging
- ✅ Development optimizations

### 2. Make Changes Without Restart

Now you can edit any Java file and the server will automatically restart:

1. **Edit a Controller**: Change a method in `AuthController.java`
2. **Save the file**: The server detects the change
3. **Automatic restart**: Watch the console output
4. **Test immediately**: Your changes are live!

## 🛠️ What's Included

### Spring Boot DevTools
- **Automatic restart**: Detects classpath changes and restarts the app context
- **LiveReload**: Browser automatically refreshes when static resources change
- **Property defaults**: Optimizes caching and logging for development

### Development Profile
- **Enhanced logging**: See SQL queries and debug information
- **CORS configured**: Works seamlessly with frontend on localhost
- **Faster startup**: Optimized JVM settings

### Smart Restart
- **Fast restart**: Only reloads your application classes, not the entire JVM
- **Classpath monitoring**: Watches for compiled .class file changes
- **Excluded paths**: Static resources don't trigger restarts

## 📝 Development Workflow

### Typical Development Session

1. **Start the server once**:
   ```bash
   ./start-dev.sh
   ```

2. **Edit your code**: Make changes to any `.java` file

3. **Save and see changes**: The server automatically restarts in ~2-3 seconds

4. **Test immediately**: Your API changes are live

### Example: Adding a New Endpoint

1. **Add method to AuthController.java**:
   ```java
   @GetMapping("/hello")
   public ResponseEntity<String> hello() {
       return ResponseEntity.ok("Hello from hot reload!");
   }
   ```

2. **Save the file** - Watch console output:
   ```
   Restarting due to 1 class path change
   Started RecovRApplication in 2.847 seconds
   ```

3. **Test immediately**:
   ```bash
   curl http://localhost:8080/api/auth/hello
   ```

## 🔧 Scripts Available

### Development Scripts

- **`./start-dev.sh`**: Start with hot reload and development features
- **`./quick-restart.sh`**: Clean restart when needed
- **`./setup-db.sh`**: Initialize database

### When to Use Each

- **Most of the time**: Use `./start-dev.sh` and let hot reload handle changes
- **When things get weird**: Use `./quick-restart.sh` for a clean start
- **First time setup**: Use `./setup-db.sh` to create database

## 🎯 What Triggers Restart

### Will Restart (Good!)
- ✅ Changes to `.java` files in `src/main/java`
- ✅ Changes to `application.properties`
- ✅ Adding new dependencies (after Maven reload)
- ✅ Changes to configuration classes

### Won't Restart (By Design)
- ❌ Changes to static resources (`src/main/resources/static`)
- ❌ Changes to templates
- ❌ Changes to test files

## 🔍 Monitoring Changes

### Console Output
When a file changes, you'll see:
```
Restarting due to 1 class path change (0 deletions, 0 additions, 1 modification)
2024-01-15 10:30:45 - Starting RecovRApplication...
2024-01-15 10:30:47 - Started RecovRApplication in 2.847 seconds
```

### File Change Detection
DevTools monitors these locations:
- `src/main/java` - Your source code
- `src/main/resources` - Configuration files
- `target/classes` - Compiled classes

## 🚫 Troubleshooting

### Hot Reload Not Working?

1. **Check DevTools is included**:
   ```bash
   ./mvnw dependency:tree | grep devtools
   ```

2. **Verify auto-compilation** (if using IDE):
   - IntelliJ: Enable "Build project automatically"
   - VS Code: Enable "Java: Autobuild"
   - Eclipse: Enable "Build automatically"

3. **Check file compilation**:
   - Look for updated `.class` files in `target/classes`
   - Check IDE console for compilation errors

### Restart is Slow?

1. **Use quick restart**:
   ```bash
   ./quick-restart.sh
   ```

2. **Check memory settings** in `start-dev.sh`:
   ```bash
   export JAVA_OPTS="-Xmx2g -Xms1g"  # Increase if needed
   ```

### Changes Not Reflected?

1. **Hard restart**:
   ```bash
   ./quick-restart.sh
   ```

2. **Check for compilation errors**:
   ```bash
   ./mvnw compile
   ```

3. **Clear browser cache** or use incognito mode

## 🎉 Benefits

### Time Savings
- **No manual restarts**: Save 10-30 seconds per change
- **Faster development**: Focus on coding, not server management
- **Immediate feedback**: See results instantly

### Better Development Experience
- **Continuous testing**: Test as you code
- **Rapid iteration**: Try different approaches quickly
- **Less context switching**: Stay in your editor

### Productivity Boost
- **Average 50+ restarts per day** → Now automatic
- **2-3 minutes saved per restart** → 100+ minutes saved daily
- **Focus on code quality** instead of server management

## 🚀 Next Steps

1. **Start developing**: Use `./start-dev.sh` and never look back
2. **Configure your IDE**: See `.idea-settings.md` for IDE-specific setup
3. **Add LiveReload extension**: Get browser auto-refresh too
4. **Enjoy coding**: Focus on features, not infrastructure!

---

**Happy coding! 🎉 No more manual restarts!**