import {Anchor, Button, Container, Notification, Paper, PasswordInput, Text, TextInput,} from '@mantine/core';
import classes from './SignIn.module.css';
import {Link, useNavigate} from "react-router-dom";
import {useForm} from "@mantine/form";
import {useState} from "react";
import {authWithUsernameAndPassword} from "../../lib";

export const SignIn = () => {

    const navigate = useNavigate()
    const [apiError, setApiError] = useState<string>()

    const signInWithEmailAndPassword = (values: {
        email: string;
        password: string;
    }) => {
        authWithUsernameAndPassword({email: values.email, password: values.password}).then((user) => {
            console.log("user,", user)
            setApiError(undefined);
            navigate("/")
        }).catch(err => {
            setApiError(err.message)
        })

    }

    const form = useForm({
        mode: 'uncontrolled',
        initialValues: {
            email: '',
            password: '',
        },
        validate: {
            email: (value) => {
                return (/^\S+@\S+$/.test(value) ? null : 'Invalid email')
            }
        },
    });

    return (<div className={classes.wrapper}>
        <Container size={420} my={40}>
            <Paper withBorder shadow="md" p={30} mt={30} radius="md" bg="var(--mantine-color-blue-light)">

                <Text size="lg" ta="center" mt={5}>
                    Sign In
                </Text>

                {apiError && <Notification withBorder color="red" title="Unable to sign in"
                                           onClose={() => setApiError(undefined)}>
                    {apiError}
                </Notification>}

                <form onSubmit={form.onSubmit((values) => signInWithEmailAndPassword(values))}>
                    <TextInput label="Email" placeholder="Email" mt={"md"} required
                               key={form.key('email')} {...form.getInputProps('email')}/>

                    <PasswordInput label="Password" placeholder="Your password" required mt="md"
                                   key={form.key('password')} {...form.getInputProps('password')}/>

                    <Button fullWidth mt="xl" type={"submit"}>
                        Sign In
                    </Button>

                    <Text c="dimmed" size="sm" ta="center" mt={25}>
                        Do not have an account yet?{' '}

                        <Link to={"/register"}>
                            <Anchor size="sm" component="button"> Create account </Anchor></Link>

                    </Text>

                </form>

            </Paper>
        </Container>
    </div>)
}