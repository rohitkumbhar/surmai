import {Button, Container, Notification, Paper, PasswordInput, Text, TextInput} from '@mantine/core';
import {useForm} from "@mantine/form";
import {useState} from "react";
import {useNavigate} from "react-router-dom";
import {createUserWithPassword} from "../../lib/auth.ts";

export const SignUp = () => {

    const [apiError, setApiError] = useState<string>()
    const navigate = useNavigate()
    const createAccount = async (values: {
        email: string;
        fullName: string;
        password: string;
        confirmPassword?: string;
    }) => {
        const {email, password, fullName, confirmPassword} = values;
        createUserWithPassword({email, name: fullName, password, passwordConfirm: confirmPassword || ''})
            .then(() => {
                navigate("/login")
            }).catch(err => setApiError(err.message))
    }

    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            email: '',
            fullName: '',
            password: '',
            confirmPassword: ''
        },

        validate: {
            email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
            confirmPassword: (value, values) => {
                return values.password !== value ? "Passwords do not match" : null
            }
        },
    });

    return (<>
        <Container size={420} my={40}>
            <Paper withBorder shadow="md" p={30} mt={30} radius="md" bg="var(--mantine-color-blue-light)">

                <Text size="lg" ta="center" mt={5}>
                    Create An Account
                </Text>

                {apiError && <Notification withBorder color="red" title="Unable to create account"
                                           onClose={() => setApiError(undefined)}>
                    {apiError}
                </Notification>}

                <form onSubmit={form.onSubmit((values) => createAccount(values))}>
                    <TextInput label="Name" placeholder="Name" mt={"md"} required
                               key={form.key('fullName')} {...form.getInputProps('fullName')}/>
                    <TextInput label="Email" placeholder="you@email.com" mt={"md"} required
                               key={form.key('email')} {...form.getInputProps('email')}/>
                    <PasswordInput label="Password" placeholder="Your password" required mt="md"
                                   key={form.key('password')} {...form.getInputProps('password')}/>
                    <PasswordInput label="Confirm Password" placeholder="Confirm password" required mt="md"
                                   key={form.key('confirmPassword')} {...form.getInputProps('confirmPassword')}/>

                    <Button fullWidth mt="xl" type={"submit"}>
                        Create Account
                    </Button>

                </form>

            </Paper>
        </Container>
    </>)
}