# Form Component Usage

This directory contains examples of how to use the Shadcn UI components in this project.

## Form Component

The `form.tsx` component is a wrapper around React Hook Form that provides form validation using Zod. It includes the following components:

- `Form`: The main form component
- `FormField`: Wrapper for form fields
- `FormItem`: Container for form items
- `FormLabel`: Label for form items
- `FormControl`: Control for form items
- `FormDescription`: Description for form items
- `FormMessage`: Error message for form items

### Basic Usage

```tsx
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

// 1. Define your form schema with Zod
const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

export function MyForm() {
  // 2. Define your form using useForm
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  })

  // 3. Define a submit handler
  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  // 4. Render your form
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}
```

### Using with Other Form Controls

The form components can be used with any form control components by using the `FormControl` component:

```tsx
<FormField
  control={form.control}
  name="bio"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Bio</FormLabel>
      <FormControl>
        <Textarea placeholder="Tell us about yourself" {...field} />
      </FormControl>
      <FormDescription>
        Your public profile bio.
      </FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

### Full Working Example

See the `form-example.tsx` file in this directory for a complete working example. 