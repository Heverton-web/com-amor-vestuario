-- Add 'clube' to the lead_reason enum if it does not already exist
ALTER TYPE public.lead_reason ADD VALUE IF NOT EXISTS 'clube';

-- Update the lead_to_kanban trigger function to route 'clube' leads to the 'clube' board
CREATE OR REPLACE FUNCTION public.lead_to_kanban()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE board_name TEXT; stage_name TEXT;
BEGIN
  IF NEW.reason::text = 'orcamento' THEN board_name := 'orcamento'; stage_name := 'novo';
  ELSIF NEW.reason::text = 'fardamento' THEN board_name := 'fardamento'; stage_name := 'novo';
  ELSIF NEW.reason::text = 'clube' THEN board_name := 'clube'; stage_name := 'novo';
  ELSE board_name := 'duvidas'; stage_name := NEW.reason::text;
  END IF;

  INSERT INTO public.kanban_cards (board, stage, title, description, contact_name, contact_whatsapp, lead_id)
  VALUES (board_name, stage_name, NEW.name, NEW.message, NEW.name, NEW.whatsapp, NEW.id);
  RETURN NEW;
END; $$;
