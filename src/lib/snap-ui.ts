export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type ElementNode = {
  type: string;
  props?: Record<string, JsonValue>;
  children?: string[];
  on?: Record<string, JsonValue>;
};

type SnapResponse = {
  version: "2.0";
  theme: {
    accent?: "gray" | "blue" | "red" | "amber" | "green" | "teal" | "purple" | "pink";
  };
  ui: {
    root: string;
    elements: Record<string, ElementNode>;
  };
};

type ButtonSpec = {
  id: string;
  label: string;
  variant?: "primary" | "secondary";
  icon?: string;
  action: { action: string; params: Record<string, JsonValue> };
};

export function createPage(elements: Record<string, ElementNode>, rootChildren: string[]): SnapResponse {
  return {
    version: "2.0",
    theme: {
      accent: "green",
    },
    ui: {
      root: "page",
      elements: {
        page: stack(rootChildren),
        ...elements,
      },
    },
  };
}

export function text(content: string, weight?: "bold" | "regular", color?: "primary" | "secondary"): ElementNode {
  return {
    type: "text",
    props: {
      content,
      ...(weight ? { weight } : {}),
      ...(color ? { color } : {}),
    },
  };
}

export function input(name: string, label: string, placeholder: string, defaultValue = ""): ElementNode {
  return {
    type: "input",
    props: {
      name,
      label,
      placeholder,
      defaultValue,
    },
  };
}

export function stack(children: string[], direction: "vertical" | "horizontal" = "vertical"): ElementNode {
  return {
    type: "stack",
    props: {
      direction,
      gap: "sm",
    },
    children,
  };
}

export function button(spec: ButtonSpec): ElementNode {
  return {
    type: "button",
    props: {
      label: spec.label,
      variant: spec.variant ?? "secondary",
      ...(spec.icon ? { icon: spec.icon } : {}),
    },
    on: {
      press: spec.action,
    },
  };
}

export function addButtons(target: Record<string, ElementNode>, buttons: ButtonSpec[]) {
  for (const item of buttons) {
    target[item.id] = button(item);
  }
}
