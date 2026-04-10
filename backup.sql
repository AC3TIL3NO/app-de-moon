--
-- PostgreSQL database dump
--

\restrict rYGLvU7ieSIN8bm39AuXrm9FoQcaPx7nJGNA9hhKPQ1zLUgSSX2SF9ohJCk4ZiJ

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: user_role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role AS ENUM (
    'ADMIN',
    'RECEPTIONIST',
    'INSTRUCTOR'
);


ALTER TYPE public.user_role OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: classes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    name text NOT NULL,
    instructor_id integer NOT NULL,
    "time" text NOT NULL,
    duration integer NOT NULL,
    capacity integer NOT NULL,
    enrolled integer DEFAULT 0 NOT NULL,
    level text NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'Activa'::text NOT NULL,
    day_of_week text NOT NULL,
    date text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.classes OWNER TO postgres;

--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.classes_id_seq OWNER TO postgres;

--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: client_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.client_memberships (
    id integer NOT NULL,
    client_id integer NOT NULL,
    membership_id integer NOT NULL,
    membership_name text NOT NULL,
    client_name text NOT NULL,
    start_date text NOT NULL,
    end_date text NOT NULL,
    classes_used integer DEFAULT 0 NOT NULL,
    classes_total integer NOT NULL,
    status text DEFAULT 'Activa'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.client_memberships OWNER TO postgres;

--
-- Name: client_memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.client_memberships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.client_memberships_id_seq OWNER TO postgres;

--
-- Name: client_memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.client_memberships_id_seq OWNED BY public.client_memberships.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text DEFAULT ''::text NOT NULL,
    plan text NOT NULL,
    classes_remaining integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    password_hash text,
    clerk_user_id text,
    policies_accepted_at timestamp with time zone
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clients_id_seq OWNER TO postgres;

--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: instructors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instructors (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL,
    specialties text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.instructors OWNER TO postgres;

--
-- Name: instructors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.instructors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instructors_id_seq OWNER TO postgres;

--
-- Name: instructors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.instructors_id_seq OWNED BY public.instructors.id;


--
-- Name: memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.memberships (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    total_classes integer NOT NULL,
    price integer NOT NULL,
    duration_days integer NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    promo_price integer,
    is_public boolean DEFAULT true NOT NULL
);


ALTER TABLE public.memberships OWNER TO postgres;

--
-- Name: memberships_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.memberships_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.memberships_id_seq OWNER TO postgres;

--
-- Name: memberships_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.memberships_id_seq OWNED BY public.memberships.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id integer NOT NULL,
    client_id integer NOT NULL,
    membership_id integer,
    amount real NOT NULL,
    stripe_session_id text,
    stripe_payment_intent_id text,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    reservation_id integer,
    concept text DEFAULT 'Membresía'::text NOT NULL,
    payment_method text DEFAULT 'Stripe'::text NOT NULL,
    card_brand text,
    card_last4 text,
    charged_by text DEFAULT 'Sistema'::text NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_id_seq OWNER TO postgres;

--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reservations (
    id integer NOT NULL,
    client_id integer NOT NULL,
    class_id integer NOT NULL,
    date text NOT NULL,
    status text DEFAULT 'Confirmada'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    attended boolean DEFAULT false NOT NULL
);


ALTER TABLE public.reservations OWNER TO postgres;

--
-- Name: reservations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reservations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reservations_id_seq OWNER TO postgres;

--
-- Name: reservations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reservations_id_seq OWNED BY public.reservations.id;


--
-- Name: studios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.studios (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo_url text,
    primary_color text DEFAULT '#7C3AED'::text NOT NULL,
    secondary_color text DEFAULT '#A78BFA'::text NOT NULL,
    phone text,
    email text,
    address text,
    cancellation_policy text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_methods text DEFAULT '["Efectivo","Yappy","Visa","Mastercard","PayPal","PagueloFacil","Transferencia"]'::text
);


ALTER TABLE public.studios OWNER TO postgres;

--
-- Name: studios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.studios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.studios_id_seq OWNER TO postgres;

--
-- Name: studios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.studios_id_seq OWNED BY public.studios.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password_hash text NOT NULL,
    role public.user_role DEFAULT 'ADMIN'::public.user_role NOT NULL,
    studio_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: client_memberships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_memberships ALTER COLUMN id SET DEFAULT nextval('public.client_memberships_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: instructors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructors ALTER COLUMN id SET DEFAULT nextval('public.instructors_id_seq'::regclass);


--
-- Name: memberships id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships ALTER COLUMN id SET DEFAULT nextval('public.memberships_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: reservations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations ALTER COLUMN id SET DEFAULT nextval('public.reservations_id_seq'::regclass);


--
-- Name: studios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studios ALTER COLUMN id SET DEFAULT nextval('public.studios_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.classes (id, name, instructor_id, "time", duration, capacity, enrolled, level, type, status, day_of_week, date, created_at) FROM stdin;
9	Clase 11:00	1	11:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
10	Clase 12:00	1	12:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
11	Clase 13:00	1	13:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
12	Clase 14:00	1	14:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
13	Clase 15:00	1	15:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
14	Clase 16:00	1	16:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
15	Clase 17:00	1	17:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
16	Clase 18:00	1	18:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
17	Clase 10:00	1	10:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
18	Clase 11:00	1	11:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
19	Clase 12:00	1	12:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
20	Clase 13:00	1	13:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
21	Clase 14:00	1	14:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
22	Clase 15:00	1	15:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
23	Clase 16:00	1	16:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
24	Clase 17:00	1	17:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
25	Clase 18:00	1	18:00	60	6	0	Principiante	Reformer	Activa	Martes	2026-04-07	2026-04-07 03:44:49.043057+00
26	Clase 10:00	1	10:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
27	Clase 11:00	1	11:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
28	Clase 12:00	1	12:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
29	Clase 13:00	1	13:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
30	Clase 14:00	1	14:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
31	Clase 15:00	1	15:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
32	Clase 16:00	1	16:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
33	Clase 17:00	1	17:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
34	Clase 18:00	1	18:00	60	6	0	Principiante	Reformer	Activa	Miércoles	2026-04-07	2026-04-07 03:44:49.043057+00
35	Clase 10:00	1	10:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
36	Clase 11:00	1	11:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
37	Clase 12:00	1	12:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
38	Clase 13:00	1	13:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
39	Clase 14:00	1	14:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
40	Clase 15:00	1	15:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
41	Clase 16:00	1	16:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
42	Clase 17:00	1	17:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
43	Clase 18:00	1	18:00	60	6	0	Principiante	Reformer	Activa	Jueves	2026-04-07	2026-04-07 03:44:49.043057+00
44	Clase 10:00	1	10:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
45	Clase 11:00	1	11:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
46	Clase 12:00	1	12:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
47	Clase 13:00	1	13:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
48	Clase 14:00	1	14:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
49	Clase 15:00	1	15:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
50	Clase 16:00	1	16:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
51	Clase 17:00	1	17:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
52	Clase 18:00	1	18:00	60	6	0	Principiante	Reformer	Activa	Viernes	2026-04-07	2026-04-07 03:44:49.043057+00
62	Clase 10:00	1	10:00	60	6	0	Principiante	Reformer	Activa	Sábado	2026-04-07	2026-04-07 03:44:49.043057+00
63	Clase 11:00	1	11:00	60	6	0	Principiante	Reformer	Activa	Sábado	2026-04-07	2026-04-07 03:44:49.043057+00
64	Clase 12:00	1	12:00	60	6	0	Principiante	Reformer	Activa	Sábado	2026-04-07	2026-04-07 03:44:49.043057+00
8	Clase 10:00	1	10:00	60	6	0	Principiante	Reformer	Activa	Lunes	2026-04-07	2026-04-07 03:44:49.043057+00
65	Clase 13:00	1	13:00	60	6	0	Principiante	Reformer	Activa	Sábado	2026-04-07	2026-04-07 03:44:49.043057+00
72	Pilates Reformer	1	14:00	60	6	0	Intermedio	Reformer	Activa	Sábado	2026-04-07	2026-04-07 18:40:43.952917+00
73	Pilates Mat	1	15:00	60	6	0	Principiante	Mat	Activa	Sábado	2026-04-07	2026-04-07 18:40:47.892911+00
74	Clase Privada	1	16:00	60	6	0	Avanzado	Privada	Activa	Sábado	2026-04-07	2026-04-07 18:40:51.700379+00
75	Pilates Reformer	1	17:00	60	6	0	Intermedio	Reformer	Activa	Sábado	2026-04-07	2026-04-07 18:40:55.61177+00
76	Pilates Mat	1	18:00	60	6	0	Principiante	Mat	Activa	Sábado	2026-04-07	2026-04-07 18:40:59.415198+00
\.


--
-- Data for Name: client_memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.client_memberships (id, client_id, membership_id, membership_name, client_name, start_date, end_date, classes_used, classes_total, status, created_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, name, phone, email, plan, classes_remaining, notes, created_at, password_hash, clerk_user_id, policies_accepted_at) FROM stdin;
\.


--
-- Data for Name: instructors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instructors (id, name, email, phone, specialties, created_at) FROM stdin;
1	Ana García	ana@pilatestudio.com	+52 55 1234 5678	{Reformer,Mat}	2026-04-06 17:23:31.738622+00
2	Carlos López	carlos@pilatestudio.com	+52 55 8765 4321	{Reformer,Privada}	2026-04-06 17:23:31.738622+00
3	Sofía Martínez	sofia@pilatestudio.com	+52 55 5555 9999	{Mat,Principiante}	2026-04-06 17:23:31.738622+00
4	Shantel amaya	dvdvd@hotmail.com	64464647	{"la master"}	2026-04-06 17:32:53.111168+00
\.


--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.memberships (id, name, description, total_classes, price, duration_days, active, created_at, promo_price, is_public) FROM stdin;
1	Pilates Básico	4 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos	4	75	30	t	2026-04-06 18:33:38.522381+00	\N	t
2	Pilates Plus	8 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos	8	135	30	t	2026-04-06 18:33:38.595179+00	\N	t
3	Pilates Premium	12 clases al mes\nPrecios sin ITBMS\nClases de 60 minutos\nAcceso prioritario	12	180	30	t	2026-04-06 18:33:38.641956+00	\N	t
5	Clase Privada	Clase privada individual	1	30	1	t	2026-04-07 19:27:47.859082+00	\N	f
6	Clase Privada Dual	Clase privada para dos personas	1	40	1	t	2026-04-07 19:27:47.863274+00	\N	f
7	Clase Individual Grupal	clase grupal	1	20	1	t	2026-04-07 20:04:23.641706+00	\N	f
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, client_id, membership_id, amount, stripe_session_id, stripe_payment_intent_id, status, created_at, reservation_id, concept, payment_method, card_brand, card_last4, charged_by) FROM stdin;
6	1	2	135	\N	\N	paid	2026-04-08 15:48:59.148794	\N	Membresía Pilates Plus — María Hernández	Efectivo	\N	\N	Admin Demo
7	4	\N	50	LK-PV7I0WLIT4HSOPBG	\N	pending	2026-04-09 01:25:51.269166	\N	Test	PagaloFácil	\N	\N	Sistema
\.


--
-- Data for Name: reservations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reservations (id, client_id, class_id, date, status, created_at, attended) FROM stdin;
\.


--
-- Data for Name: studios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.studios (id, name, slug, logo_url, primary_color, secondary_color, phone, email, address, cancellation_policy, created_at, payment_methods) FROM stdin;
1	Moon Pilates Studio	demo	\N	#C49A1E	#A78BFA	+507 6586-9949	moonpilatesstudiopty@gmail.com	Atrio Mall Costa del Este Piso 2 Local C-16, Panamá	24 horas de antelación para cancelar sin costo.	2026-04-06 18:53:33.483536+00	["Efectivo","Yappy","Visa","Mastercard","PayPal","PagueloFacil","Transferencia"]
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, password_hash, role, studio_id, created_at) FROM stdin;
4	moonpilatesstudiopty@gmail.com	Shantel Amaya	$2b$10$DXo25BeVhCs2kmUOcaF9ZedRTmiHJiRlmUFCUzWxqrIdf9kqXW3mC	ADMIN	1	2026-04-08 17:11:22.443574+00
5	recep.test@studio.com	Test Recepcionista	$2b$10$OJjW.La4gL.6x9k/kh539.pHVXsVfloovOX/hUEbyFhV1ea3r8zl6	RECEPTIONIST	1	2026-04-08 17:16:53.604289+00
\.


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.classes_id_seq', 115, true);


--
-- Name: client_memberships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.client_memberships_id_seq', 12, true);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clients_id_seq', 6, true);


--
-- Name: instructors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.instructors_id_seq', 4, true);


--
-- Name: memberships_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.memberships_id_seq', 7, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.payments_id_seq', 7, true);


--
-- Name: reservations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reservations_id_seq', 17, true);


--
-- Name: studios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.studios_id_seq', 1, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: client_memberships client_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_memberships
    ADD CONSTRAINT client_memberships_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: instructors instructors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_pkey PRIMARY KEY (id);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: reservations reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_pkey PRIMARY KEY (id);


--
-- Name: studios studios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studios
    ADD CONSTRAINT studios_pkey PRIMARY KEY (id);


--
-- Name: studios studios_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.studios
    ADD CONSTRAINT studios_slug_unique UNIQUE (slug);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: clients_phone_nonempty_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX clients_phone_nonempty_unique ON public.clients USING btree (phone) WHERE (phone <> ''::text);


--
-- Name: classes classes_instructor_id_instructors_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_instructor_id_instructors_id_fk FOREIGN KEY (instructor_id) REFERENCES public.instructors(id);


--
-- Name: client_memberships client_memberships_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_memberships
    ADD CONSTRAINT client_memberships_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: client_memberships client_memberships_membership_id_memberships_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.client_memberships
    ADD CONSTRAINT client_memberships_membership_id_memberships_id_fk FOREIGN KEY (membership_id) REFERENCES public.memberships(id);


--
-- Name: reservations reservations_class_id_classes_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_class_id_classes_id_fk FOREIGN KEY (class_id) REFERENCES public.classes(id);


--
-- Name: reservations reservations_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reservations
    ADD CONSTRAINT reservations_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: users users_studio_id_studios_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_studio_id_studios_id_fk FOREIGN KEY (studio_id) REFERENCES public.studios(id);


--
-- PostgreSQL database dump complete
--

\unrestrict rYGLvU7ieSIN8bm39AuXrm9FoQcaPx7nJGNA9hhKPQ1zLUgSSX2SF9ohJCk4ZiJ

