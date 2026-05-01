-- 1. Appointments Table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own appointments" ON public.appointments
    FOR SELECT USING (auth.uid()::text = doctor_id::text OR auth.uid()::text = patient_id::text);

CREATE POLICY "Allow patients to insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.uid()::text = patient_id::text);

CREATE POLICY "Allow updates to own appointments" ON public.appointments
    FOR UPDATE USING (auth.uid()::text = doctor_id::text OR auth.uid()::text = patient_id::text);

-- 2. Prescriptions Table
CREATE TABLE IF NOT EXISTS public.prescriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    medicines JSONB NOT NULL DEFAULT '[]'::jsonb, -- Stores array: [{name: 'Drug', dosage: '10mg', timing: 'morning'}]
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own prescriptions" ON public.prescriptions
    FOR SELECT USING (auth.uid()::text = doctor_id::text OR auth.uid()::text = patient_id::text);

CREATE POLICY "Allow doctors to insert prescriptions" ON public.prescriptions
    FOR INSERT WITH CHECK (auth.uid()::text = doctor_id::text);

CREATE POLICY "Allow doctors to update prescriptions" ON public.prescriptions
    FOR UPDATE USING (auth.uid()::text = doctor_id::text);

-- 3. Messages Table (Chat System)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own messages" ON public.messages
    FOR SELECT USING (auth.uid()::text = sender_id::text OR auth.uid()::text = receiver_id::text);

CREATE POLICY "Allow users to send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id::text);

-- 4. Enable Realtime for Chat (Required for live messaging)
-- (Run this if Realtime isn't enabled for messages already)
-- alter publication supabase_realtime add table messages;
