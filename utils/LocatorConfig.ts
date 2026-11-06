export type LocatorConfig =
    | { type: 'css'; value: string }
    | { type: 'xpath'; value: string }
    | { type: 'placeholder'; value: string }
    | { type: 'label'; value: string }
    | { type: 'text'; value: string }
    | { type: 'testId'; value: string }
    | { type: 'altText'; value: string }
    | { type: 'role'; role: string; name: string };