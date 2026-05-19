export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      admin_page_access: {
        Row: {
          created_at: string;
          id: string;
          page_key: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          page_key: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          page_key?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          active: boolean;
          birth_date: string | null;
          category: Database["public"]["Enums"]["customer_category"];
          cep: string | null;
          city: string | null;
          cnpj: string | null;
          code: string;
          complement: string | null;
          cpf: string | null;
          created_at: string;
          email: string | null;
          id: string;
          landline: string | null;
          name: string;
          neighborhood: string | null;
          number: string | null;
          phone: string | null;
          portal_invited_at: string | null;
          state: string | null;
          street: string | null;
          type: Database["public"]["Enums"]["customer_type"];
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          active?: boolean;
          birth_date?: string | null;
          category?: Database["public"]["Enums"]["customer_category"];
          cep?: string | null;
          city?: string | null;
          cnpj?: string | null;
          code?: string;
          complement?: string | null;
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          landline?: string | null;
          name: string;
          neighborhood?: string | null;
          number?: string | null;
          phone?: string | null;
          portal_invited_at?: string | null;
          state?: string | null;
          street?: string | null;
          type?: Database["public"]["Enums"]["customer_type"];
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          active?: boolean;
          birth_date?: string | null;
          category?: Database["public"]["Enums"]["customer_category"];
          cep?: string | null;
          city?: string | null;
          cnpj?: string | null;
          code?: string;
          complement?: string | null;
          cpf?: string | null;
          created_at?: string;
          email?: string | null;
          id?: string;
          landline?: string | null;
          name?: string;
          neighborhood?: string | null;
          number?: string | null;
          phone?: string | null;
          portal_invited_at?: string | null;
          state?: string | null;
          street?: string | null;
          type?: Database["public"]["Enums"]["customer_type"];
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [];
      };
      invoice_installments: {
        Row: {
          amount: number;
          created_at: string;
          due_date: string;
          id: string;
          invoice_id: string;
          mp_payment_id: string | null;
          number: number;
          paid_at: string | null;
          status: Database["public"]["Enums"]["invoice_status"];
        };
        Insert: {
          amount?: number;
          created_at?: string;
          due_date: string;
          id?: string;
          invoice_id: string;
          mp_payment_id?: string | null;
          number: number;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
        };
        Update: {
          amount?: number;
          created_at?: string;
          due_date?: string;
          id?: string;
          invoice_id?: string;
          mp_payment_id?: string | null;
          number?: number;
          paid_at?: string | null;
          status?: Database["public"]["Enums"]["invoice_status"];
        };
        Relationships: [
          {
            foreignKeyName: "invoice_installments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoice_payments: {
        Row: {
          amount: number;
          created_at: string;
          gateway_id: string | null;
          id: string;
          installment_id: string | null;
          invoice_id: string;
          method: Database["public"]["Enums"]["invoice_payment_method"] | null;
          paid_at: string;
          raw_payload: Json | null;
        };
        Insert: {
          amount: number;
          created_at?: string;
          gateway_id?: string | null;
          id?: string;
          installment_id?: string | null;
          invoice_id: string;
          method?: Database["public"]["Enums"]["invoice_payment_method"] | null;
          paid_at?: string;
          raw_payload?: Json | null;
        };
        Update: {
          amount?: number;
          created_at?: string;
          gateway_id?: string | null;
          id?: string;
          installment_id?: string | null;
          invoice_id?: string;
          method?: Database["public"]["Enums"]["invoice_payment_method"] | null;
          paid_at?: string;
          raw_payload?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_payments_installment_id_fkey";
            columns: ["installment_id"];
            isOneToOne: false;
            referencedRelation: "invoice_installments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          boleto_url: string | null;
          code: string;
          created_at: string;
          customer_id: string | null;
          due_date: string | null;
          id: string;
          mp_init_point: string | null;
          mp_payment_id: string | null;
          mp_preference_id: string | null;
          notes: string | null;
          order_id: string | null;
          paid_total: number;
          payment_method: Database["public"]["Enums"]["invoice_payment_method"] | null;
          pdf_url: string | null;
          pix_copia_cola: string | null;
          pix_qr: string | null;
          public_token: string;
          status: Database["public"]["Enums"]["invoice_status"];
          total: number;
          updated_at: string;
        };
        Insert: {
          boleto_url?: string | null;
          code?: string;
          created_at?: string;
          customer_id?: string | null;
          due_date?: string | null;
          id?: string;
          mp_init_point?: string | null;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          notes?: string | null;
          order_id?: string | null;
          paid_total?: number;
          payment_method?: Database["public"]["Enums"]["invoice_payment_method"] | null;
          pdf_url?: string | null;
          pix_copia_cola?: string | null;
          pix_qr?: string | null;
          public_token?: string;
          status?: Database["public"]["Enums"]["invoice_status"];
          total?: number;
          updated_at?: string;
        };
        Update: {
          boleto_url?: string | null;
          code?: string;
          created_at?: string;
          customer_id?: string | null;
          due_date?: string | null;
          id?: string;
          mp_init_point?: string | null;
          mp_payment_id?: string | null;
          mp_preference_id?: string | null;
          notes?: string | null;
          order_id?: string | null;
          paid_total?: number;
          payment_method?: Database["public"]["Enums"]["invoice_payment_method"] | null;
          pdf_url?: string | null;
          pix_copia_cola?: string | null;
          pix_qr?: string | null;
          public_token?: string;
          status?: Database["public"]["Enums"]["invoice_status"];
          total?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      kanban_cards: {
        Row: {
          amount: number | null;
          board: string;
          contact_name: string | null;
          contact_whatsapp: string | null;
          created_at: string;
          customer_id: string | null;
          description: string | null;
          id: string;
          lead_id: string | null;
          order_id: string | null;
          position: number;
          quote_id: string | null;
          stage: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          amount?: number | null;
          board: string;
          contact_name?: string | null;
          contact_whatsapp?: string | null;
          created_at?: string;
          customer_id?: string | null;
          description?: string | null;
          id?: string;
          lead_id?: string | null;
          order_id?: string | null;
          position?: number;
          quote_id?: string | null;
          stage: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          amount?: number | null;
          board?: string;
          contact_name?: string | null;
          contact_whatsapp?: string | null;
          created_at?: string;
          customer_id?: string | null;
          description?: string | null;
          id?: string;
          lead_id?: string | null;
          order_id?: string | null;
          position?: number;
          quote_id?: string | null;
          stage?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "kanban_cards_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_cards_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_cards_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "kanban_cards_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          created_at: string;
          id: string;
          message: string | null;
          name: string;
          reason: Database["public"]["Enums"]["lead_reason"];
          utm_campaign: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          whatsapp: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string | null;
          name: string;
          reason: Database["public"]["Enums"]["lead_reason"];
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          whatsapp: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string | null;
          name?: string;
          reason?: Database["public"]["Enums"]["lead_reason"];
          utm_campaign?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          whatsapp?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          color: string | null;
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          size: string | null;
          total: number;
          unit_price: number;
        };
        Insert: {
          color?: string | null;
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          quantity?: number;
          size?: string | null;
          total?: number;
          unit_price?: number;
        };
        Update: {
          color?: string | null;
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          size?: string | null;
          total?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          code: string;
          created_at: string;
          customer_id: string | null;
          finished_at: string | null;
          id: string;
          notes: string | null;
          origin_kanban: string | null;
          paid_at: string | null;
          quote_id: string | null;
          separated_at: string | null;
          shipped_at: string | null;
          shipping: number;
          source: string | null;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at: string;
        };
        Insert: {
          code?: string;
          created_at?: string;
          customer_id?: string | null;
          finished_at?: string | null;
          id?: string;
          notes?: string | null;
          origin_kanban?: string | null;
          paid_at?: string | null;
          quote_id?: string | null;
          separated_at?: string | null;
          shipped_at?: string | null;
          shipping?: number;
          source?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          customer_id?: string | null;
          finished_at?: string | null;
          id?: string;
          notes?: string | null;
          origin_kanban?: string | null;
          paid_at?: string | null;
          quote_id?: string | null;
          separated_at?: string | null;
          shipped_at?: string | null;
          shipping?: number;
          source?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      points_ledger: {
        Row: {
          created_at: string;
          customer_id: string;
          delta: number;
          description: string | null;
          id: string;
          order_id: string | null;
          reason: Database["public"]["Enums"]["points_ledger_reason"];
          redemption_id: string | null;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          delta: number;
          description?: string | null;
          id?: string;
          order_id?: string | null;
          reason: Database["public"]["Enums"]["points_ledger_reason"];
          redemption_id?: string | null;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          delta?: number;
          description?: string | null;
          id?: string;
          order_id?: string | null;
          reason?: Database["public"]["Enums"]["points_ledger_reason"];
          redemption_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "points_ledger_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_ledger_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_ledger_redemption_id_fkey";
            columns: ["redemption_id"];
            isOneToOne: false;
            referencedRelation: "redemptions";
            referencedColumns: ["id"];
          },
        ];
      };
      portal_invitations: {
        Row: {
          channel: string;
          created_at: string;
          customer_id: string;
          email: string;
          id: string;
          login_url: string;
          payload: Json | null;
          status: string;
          temp_password: string;
          whatsapp: string | null;
        };
        Insert: {
          channel: string;
          created_at?: string;
          customer_id: string;
          email: string;
          id?: string;
          login_url: string;
          payload?: Json | null;
          status?: string;
          temp_password: string;
          whatsapp?: string | null;
        };
        Update: {
          channel?: string;
          created_at?: string;
          customer_id?: string;
          email?: string;
          id?: string;
          login_url?: string;
          payload?: Json | null;
          status?: string;
          temp_password?: string;
          whatsapp?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "portal_invitations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          active: boolean;
          code: string;
          colors: string[];
          cost_price: number;
          created_at: string;
          description: string | null;
          id: string;
          images: string[];
          name: string;
          retail_price: number;
          rewards_reserved: number;
          sizes: string[];
          stock: number;
          type: Database["public"]["Enums"]["product_type"];
          updated_at: string;
          wholesale_price: number;
        };
        Insert: {
          active?: boolean;
          code?: string;
          colors?: string[];
          cost_price?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          name: string;
          retail_price?: number;
          rewards_reserved?: number;
          sizes?: string[];
          stock?: number;
          type?: Database["public"]["Enums"]["product_type"];
          updated_at?: string;
          wholesale_price?: number;
        };
        Update: {
          active?: boolean;
          code?: string;
          colors?: string[];
          cost_price?: number;
          created_at?: string;
          description?: string | null;
          id?: string;
          images?: string[];
          name?: string;
          retail_price?: number;
          rewards_reserved?: number;
          sizes?: string[];
          stock?: number;
          type?: Database["public"]["Enums"]["product_type"];
          updated_at?: string;
          wholesale_price?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      quote_items: {
        Row: {
          color: string | null;
          id: string;
          product_id: string | null;
          product_name: string;
          quantity: number;
          quote_id: string;
          size: string | null;
          total: number;
          unit_price: number;
        };
        Insert: {
          color?: string | null;
          id?: string;
          product_id?: string | null;
          product_name: string;
          quantity?: number;
          quote_id: string;
          size?: string | null;
          total?: number;
          unit_price?: number;
        };
        Update: {
          color?: string | null;
          id?: string;
          product_id?: string | null;
          product_name?: string;
          quantity?: number;
          quote_id?: string;
          size?: string | null;
          total?: number;
          unit_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      quotes: {
        Row: {
          code: string;
          consultant_name: string | null;
          created_at: string;
          customer_id: string | null;
          id: string;
          lead_id: string | null;
          notes: string | null;
          quote_date: string;
          requester_name: string | null;
          shipping: number;
          status: Database["public"]["Enums"]["quote_status"];
          subtotal: number;
          total: number;
          updated_at: string;
          valid_until: string | null;
        };
        Insert: {
          code?: string;
          consultant_name?: string | null;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          lead_id?: string | null;
          notes?: string | null;
          quote_date?: string;
          requester_name?: string | null;
          shipping?: number;
          status?: Database["public"]["Enums"]["quote_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
          valid_until?: string | null;
        };
        Update: {
          code?: string;
          consultant_name?: string | null;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          lead_id?: string | null;
          notes?: string | null;
          quote_date?: string;
          requester_name?: string | null;
          shipping?: number;
          status?: Database["public"]["Enums"]["quote_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "quotes_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      receipts: {
        Row: {
          amount: number;
          amount_in_words: string;
          city: string | null;
          code: string;
          created_at: string;
          customer_id: string | null;
          id: string;
          invoice_id: string | null;
          issuer_address: string | null;
          issuer_doc: string | null;
          issuer_name: string | null;
          notes: string | null;
          order_id: string | null;
          paid_at: string;
          payer_doc: string | null;
          payer_name: string;
          payment_method: Database["public"]["Enums"]["receipt_method"];
          public_token: string;
          reference: string;
          signature_mode: Database["public"]["Enums"]["receipt_signature_mode"];
          signature_url: string | null;
          status: Database["public"]["Enums"]["receipt_status"];
          updated_at: string;
        };
        Insert: {
          amount?: number;
          amount_in_words?: string;
          city?: string | null;
          code?: string;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          invoice_id?: string | null;
          issuer_address?: string | null;
          issuer_doc?: string | null;
          issuer_name?: string | null;
          notes?: string | null;
          order_id?: string | null;
          paid_at?: string;
          payer_doc?: string | null;
          payer_name: string;
          payment_method?: Database["public"]["Enums"]["receipt_method"];
          public_token?: string;
          reference?: string;
          signature_mode?: Database["public"]["Enums"]["receipt_signature_mode"];
          signature_url?: string | null;
          status?: Database["public"]["Enums"]["receipt_status"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          amount_in_words?: string;
          city?: string | null;
          code?: string;
          created_at?: string;
          customer_id?: string | null;
          id?: string;
          invoice_id?: string | null;
          issuer_address?: string | null;
          issuer_doc?: string | null;
          issuer_name?: string | null;
          notes?: string | null;
          order_id?: string | null;
          paid_at?: string;
          payer_doc?: string | null;
          payer_name?: string;
          payment_method?: Database["public"]["Enums"]["receipt_method"];
          public_token?: string;
          reference?: string;
          signature_mode?: Database["public"]["Enums"]["receipt_signature_mode"];
          signature_url?: string | null;
          status?: Database["public"]["Enums"]["receipt_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      redemptions: {
        Row: {
          code: string;
          created_at: string;
          customer_id: string;
          id: string;
          points_spent: number;
          reward_item_id: string;
          status: Database["public"]["Enums"]["redemption_status"];
          used_at: string | null;
          used_in_order_id: string | null;
          valid_until: string | null;
          voucher_code: string | null;
        };
        Insert: {
          code?: string;
          created_at?: string;
          customer_id: string;
          id?: string;
          points_spent: number;
          reward_item_id: string;
          status?: Database["public"]["Enums"]["redemption_status"];
          used_at?: string | null;
          used_in_order_id?: string | null;
          valid_until?: string | null;
          voucher_code?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string;
          customer_id?: string;
          id?: string;
          points_spent?: number;
          reward_item_id?: string;
          status?: Database["public"]["Enums"]["redemption_status"];
          used_at?: string | null;
          used_in_order_id?: string | null;
          valid_until?: string | null;
          voucher_code?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "redemptions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemptions_reward_item_id_fkey";
            columns: ["reward_item_id"];
            isOneToOne: false;
            referencedRelation: "reward_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "redemptions_used_in_order_id_fkey";
            columns: ["used_in_order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      reward_items: {
        Row: {
          active: boolean;
          code: string;
          created_at: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          images: string[];
          kind: Database["public"]["Enums"]["reward_kind"];
          name: string;
          points_cost: number;
          product_id: string | null;
          product_variant: Json | null;
          stock: number;
          updated_at: string;
          voucher_min_order: number;
          voucher_percent: number | null;
          voucher_value: number | null;
        };
        Insert: {
          active?: boolean;
          code?: string;
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          images?: string[];
          kind: Database["public"]["Enums"]["reward_kind"];
          name: string;
          points_cost: number;
          product_id?: string | null;
          product_variant?: Json | null;
          stock?: number;
          updated_at?: string;
          voucher_min_order?: number;
          voucher_percent?: number | null;
          voucher_value?: number | null;
        };
        Update: {
          active?: boolean;
          code?: string;
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          images?: string[];
          kind?: Database["public"]["Enums"]["reward_kind"];
          name?: string;
          points_cost?: number;
          product_id?: string | null;
          product_variant?: Json | null;
          stock?: number;
          updated_at?: string;
          voucher_min_order?: number;
          voucher_percent?: number | null;
          voucher_value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "reward_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          data: Json;
          id: number;
          updated_at: string;
        };
        Insert: {
          data?: Json;
          id?: number;
          updated_at?: string;
        };
        Update: {
          data?: Json;
          id?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      superadmins: {
        Row: {
          created_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      customer_points_balance: {
        Row: {
          balance: number | null;
          customer_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "points_ledger_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      can_access_admin_page: {
        Args: { _page: string; _user_id: string };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      is_superadmin: { Args: { _user_id: string }; Returns: boolean };
      points_balance: { Args: { _customer_id: string }; Returns: number };
    };
    Enums: {
      app_role: "admin" | "consultor" | "cliente";
      customer_category: "varejo" | "atacado" | "fardamento";
      customer_type: "pf" | "pj";
      doubt_status: "produto" | "preco" | "pagamento" | "entrega" | "resolvido";
      invoice_payment_method: "pix" | "boleto" | "cartao" | "manual";
      invoice_status: "aberta" | "paga_parcial" | "paga" | "vencida" | "cancelada";
      lead_reason: "orcamento" | "fardamento" | "produto" | "preco" | "pagamento" | "entrega";
      order_status: "realizado" | "separado" | "pago" | "enviado" | "finalizado" | "cancelado";
      points_ledger_reason: "pedido" | "resgate" | "ajuste" | "estorno";
      product_type: "convencional" | "fardamento";
      quote_status: "novo" | "gerado" | "enviado" | "aprovado" | "perdido";
      receipt_method:
        | "pix"
        | "dinheiro"
        | "cartao_credito"
        | "cartao_debito"
        | "transferencia"
        | "boleto"
        | "outro";
      receipt_signature_mode: "linha" | "imagem";
      receipt_status: "emitido" | "cancelado";
      redemption_status: "resgatado" | "utilizado" | "expirado" | "cancelado";
      reward_kind: "produto_fisico" | "voucher_valor" | "voucher_percent" | "voucher_frete";
      uniform_status: "novo" | "orcamento" | "fechado" | "aprovado" | "perdido";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "consultor", "cliente"],
      customer_category: ["varejo", "atacado", "fardamento"],
      customer_type: ["pf", "pj"],
      doubt_status: ["produto", "preco", "pagamento", "entrega", "resolvido"],
      invoice_payment_method: ["pix", "boleto", "cartao", "manual"],
      invoice_status: ["aberta", "paga_parcial", "paga", "vencida", "cancelada"],
      lead_reason: ["orcamento", "fardamento", "produto", "preco", "pagamento", "entrega"],
      order_status: ["realizado", "separado", "pago", "enviado", "finalizado", "cancelado"],
      points_ledger_reason: ["pedido", "resgate", "ajuste", "estorno"],
      product_type: ["convencional", "fardamento"],
      quote_status: ["novo", "gerado", "enviado", "aprovado", "perdido"],
      receipt_method: [
        "pix",
        "dinheiro",
        "cartao_credito",
        "cartao_debito",
        "transferencia",
        "boleto",
        "outro",
      ],
      receipt_signature_mode: ["linha", "imagem"],
      receipt_status: ["emitido", "cancelado"],
      redemption_status: ["resgatado", "utilizado", "expirado", "cancelado"],
      reward_kind: ["produto_fisico", "voucher_valor", "voucher_percent", "voucher_frete"],
      uniform_status: ["novo", "orcamento", "fechado", "aprovado", "perdido"],
    },
  },
} as const;
