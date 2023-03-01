##Улучшение механизма проверки объединенных типов

`````ts
type Source = { done: boolean; value: number };
type Target = { done: false; value: number } | { done: true; value: number };

declare let source: Source;
declare let target: Target;

target = source; // Error, до v3.5 и Ok после
```

Поскольку в примере выше тип `Source`, за исключением поля `done`, идентичен типу `Target`, новый механизм проверки объединенных типов допускает присвоение значения первого типа идентификатору принадлежащего ко второму типу.
