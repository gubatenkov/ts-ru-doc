##Массивоподобные readonly типы

Начиная с версии `v3.4`, в _TypeScript_ появилась возможность объявлять `Массивоподобные readonly структуры` типы, к которым относятся массивы (`Array`) и кортежи (`Tuples`). Данный механизм призван защитить элементы массивоподобных структур от изменения и тем самым повысить типобезопасность программ разрабатываемых на _TypeScript_. Элементы массивоподобных структур объявленных как `readonly` невозможно заменить или удалить. Кроме того, в подобные структуры невозможно добавить новые элементы.

Для того, что бы объявить `readonly` массив или кортеж достаточно указать в сигнатуре типа модификатор `readonly`.

`````ts
let array: readonly string[] = ['Kent', 'Clark']; // Массив
let tuple: readonly [string, string] = ['Kent', 'Clark']; // Кортеж
```

В случаи, объявления `readonly` массива, становится невозможно изменить его элементы с помощью индексной сигнатуры (`array[...]`)

`````ts
let array: readonly string[] = ['Kent', 'Clark'];
array[0] = 'Wayne'; // Error, Index signature in type 'readonly number[]' only permits reading.ts(2542)
array[array.length] = 'Batman'; // Error, Index signature in type 'readonly number[]' only permits reading.ts(2542)
```

Помимо этого, у `readonly` массива отсутствуют методы с помощью которым можно изменить элементы массива.

`````ts
let array: readonly string[] = ['Kent', 'Clark'];
array.push('Batman'); // Error, Property 'push' does not exist on type 'readonly number[]'.ts(2339)
array.shift(); // Error, Property 'shift' does not exist on type 'readonly number[]'.ts(2339)

array.indexOf('Kent'); // Ok
array.map((item) => item); // Ok
```

С учетом погрешности на известные различия между массивом и кортежем, справедливо утверждать, что правила для `readonly` массива, справедливы и для `readonly` кортежа.

Помимо того, что невозможно изменить или удалить слоты кортежа, он также теряет признаки массива, которые способны привести его к изменению.

`````ts
let tuple: readonly [string, string] = ['Kent', 'Clark'];
tuple[0] = 'Wayne'; // Error, Cannot assign to '0' because it is a read-only property.ts(2540)

tuple.push('Batman'); // Error, Property 'push' does not exist on type 'readonly [string, string]'.ts(2339)
tuple.shift(); // Error, Property 'shift' does not exist on type 'readonly [string, string]'.ts(2339)

tuple.indexOf('Kent'); // Ok
tuple.map((item) => item); // Ok
```

Кроме того, механизм массивоподобных `readonly` структур, начиная с версии _TypeScript_ `v3.4`, повлиял на поведение такого расширенного типа, как `Readonly<T>`.

До версии `v3.4` поведение типа `Readonly<T>` полноценно распространялось только на объекты.

`````ts
// Ok, { readonly a: string, readonly b: number }
type A = Readonly<{ a: string; b: number }>;

// Bad, number[]
type B = Readonly<number[]>;

// Bad, [string, boolean]
type C = Readonly<[string, boolean]>;
```

Но начиная с версии `v3.4` поведение для типа `Readonly<T>` дополняется поведением массивоподобных `readonly` структур.

`````ts
// Ok, { readonly a: string, readonly b: number }
type A = Readonly<{ a: string; b: number }>;

// Ok, readonly number[]
type B = Readonly<number[]>;

// Ok, readonly [string, boolean]
type C = Readonly<[string, boolean]>;
```

Напоследок стоит упомянуть, что используя механизм массивоподобных `readonly` структур, по своей сути, компилятор расценивает эти структуры, как принадлежащие к интерфейсу добавленному в версии `v3.4` `ReadonlyArray<T>`,речь о котором пойдет далее.
