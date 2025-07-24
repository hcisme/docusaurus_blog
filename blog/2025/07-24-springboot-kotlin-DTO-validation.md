---
slug: springboot-kotlin-DTO-validation
title: SpringBoot Kotlin 中优雅处理 DTO 非空校验
authors: [hcisme]
tags: [kotlin, spring, springboot]
---

---

# Spring Boot Kotlin 中优雅处理 DTO 非空校验：属性委托方案

> 在 Spring Boot Kotlin 开发中，如何处理 DTO 的非空校验同时保持代码清晰度？本文将介绍传统方案的痛点，并展示如何使用 Kotlin 属性委托实现优雅的解决方案。

## 问题

在 Spring Boot Java 项目中，我们通常这样处理 DTO 的非空校验：

```java
public class UserDTO {
    @NotNull(message = "用户名不能为空")
    private String username;
    
    // getter 和 setter
}
```

但在 Kotlin 中，我们期望写出更符合空安全特性的代码：

```kotlin
class UserDTO {
    @field:NotBlank(message = "用户名不能为空")
    var username: String = ""
}
```

然而这种方式存在两个主要问题：

1. **原始类型（Int, Long 等）无法使用 lateinit**
2. **默认值会绕过 @NotNull 校验**
3. **他人看到迷惑  容易引起歧义**

### 原始类型问题

对于原始类型，我们无法使用 `lateinit`：

```kotlin
class ActionDTO {
    // 编译错误：'lateinit' modifier is not allowed on primitive types
    @field:NotNull
    lateinit var actionType: Int
}
```

### 默认值问题

当使用默认值时，空值会被默认值替换，导致校验失效：

```kotlin
class TestDTO {
    @field:NotNull(message = "type 不能为空")
    var type: Int = 0 // 默认值会导致空请求通过校验
}

// 请求 {} 会通过校验，type=0
```

## 解决方案：属性委托 + 注解

Kotlin 属性委托机制的解决方案：

### 1. 创建非空委托类

```kotlin
import kotlin.properties.ReadWriteProperty
import kotlin.reflect.KProperty

/**
 * 非空属性委托
 * 确保属性在使用前已被初始化
 */
class NotNullVar<T : Any>() : ReadWriteProperty<Any, T> {
    private var value: T? = null

    override fun getValue(thisRef: Any, property: KProperty<*>): T {
        return value ?: throw IllegalStateException(
            "${property.name} 未初始化"
        )
    }

    override fun setValue(thisRef: Any, property: KProperty<*>, value: T) {
        this.value = value
    }
}
```

### 2. 在 DTO 中使用委托属性

```kotlin
import javax.validation.constraints.NotBlank
import javax.validation.constraints.NotNull

class UserDTO {
    @get:NotBlank(message = "用户名不能为空")
    var username: String by NotNullVar()

    @get:NotNull(message = "年龄不能为空")
    var age: Int by NotNullVar() // 原始类型也可用

    @get:Email(message = "邮箱格式不正确")
    var email: String by NotNullVar()
}
```

**关键点**：
- 使用 `@get:注解` 而非 `@field:注解`
- 委托属性同时适用于原始类型和引用类型
- 业务代码中可直接使用非空值

### 3. Controller 中使用

```kotlin
@RestController
@RequestMapping("/users")
class UserController {

    @PostMapping
    fun createUser(@Valid @RequestBody userDTO: UserDTO): User {
        // 直接使用非空属性（无需安全操作符）
        val user = User(
            name = userDTO.username,
            age = userDTO.age,
            email = userDTO.email
        )
        
        return user
    }
}
```

### 4. 改变 jackson 配置
```
spring:
  jackson:
    deserialization:
      fail-on-null-for-primitives: true
```
**原因**：

Kotlin 反序列化时对基本类型（Int、Long、Boolean 等）的 null 值会有默认值策略。

Spring Boot 默认使用 Jackson 来把 JSON 转成对象，当 JSON 里 `{"type": null}` 并且你的属性是非可空（Int）时，Jackson 会把它当成基本类型的默认值，也就是 0。

fail-on-null-for-primitives: true 抛异常就行了 然后再捕获异常就行

## 方案优势

1. **代码清晰度**
   - 属性声明为非空类型
   - 业务代码无需安全操作符（`!!` 或 `?.`）
   - 避免可空类型引起的歧义

2. **校验有效性**
   - 正确处理原始类型校验
   - 不会因默认值绕过校验
   - 支持所有标准校验注解

3. **类型安全**
   - 编译时检查属性访问
   - 运行时确保非空
   - 减少空指针异常风险

4. **扩展性强**
   ```kotlin
   // 自定义校验注解
   @get:PositiveOrZero(message = "积分不能为负")
   var points: Int by NotNullVar()
   
   // 集合校验
   @get:Size(min = 1, message = "至少选择一个爱好")
   var hobbies: List<String> by NotNullVar()
   ```

## 与传统方案对比

| 特性                | 传统方案 (可空类型)         | 委托方案               |
|---------------------|----------------------------|-----------------------|
| 属性声明            | `var age: Int? = null`     | `var age: Int by NotNullVar()` |
| 业务代码使用        | `userDTO.age!!`            | `userDTO.age`         |
| 原始类型支持        | 是                         | 是                    |
| 默认值问题          | 存在                       | 不存在                |
| 代码可读性          | 较低（属性可空但业务非空） | 高（属性始终非空）    |
| 校验失败触发        | 是                         | 是                    |
| 额外运行时依赖      | 无                         | 无                    |

## 常见问题解答

### 1. 为什么使用 `@get:` 而不是 `@field:`？

在委托属性中：
- `@field:` 作用于字段，但委托属性没有直接字段
- `@get:` 作用于 getter 方法，Spring 校验通过 getter 访问值
- `@delegate:` 也可用，但 `@get:` 更通用