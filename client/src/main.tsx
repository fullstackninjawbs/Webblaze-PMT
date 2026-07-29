import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme, Button, Card, Modal, Drawer, TextInput, Select, PasswordInput, NumberInput, Textarea, Table, Badge } from '@mantine/core';
import { store } from './app/store';
import App from './App';
import '@mantine/core/styles.css';
import './index.css';

const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
  headings: {
    fontFamily: 'Inter, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2rem' },
      h2: { fontSize: '1.5rem' },
      h3: { fontSize: '1.25rem' },
    }
  },
  components: {
    Container: {
      defaultProps: {
        sizes: {
          xs: 540,
          sm: 720,
          md: 960,
          lg: 1140,
          xl: 1920,
        },
      },
    },
    Button: Button.extend({
      defaultProps: {
        radius: 'md',
        fw: 500,
      },
      styles: (theme, params) => ({
        root: {
          transition: 'all 0.2s ease',
          boxShadow: params.variant === 'filled' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: params.variant === 'filled' ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
          }
        }
      })
    }),
    Card: Card.extend({
      defaultProps: {
        radius: 'lg',
        shadow: 'xs',
        withBorder: true,
      },
      styles: {
        root: {
          borderColor: '#E5E7EB',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }
      }
    }),
    Modal: Modal.extend({
      defaultProps: {
        radius: 'md',
        padding: 'xl',
        shadow: 'xl',
      },
      styles: {
        title: {
          fontWeight: 600,
          fontSize: '1.25rem',
          color: '#111827',
        },
        header: {
          borderBottom: '1px solid #E5E7EB',
          paddingBottom: '1rem',
          marginBottom: '1rem',
        }
      }
    }),
    Drawer: Drawer.extend({
      defaultProps: {
        padding: 'xl',
        position: 'right',
      },
      styles: {
        title: {
          fontWeight: 600,
          fontSize: '1.25rem',
          color: '#111827',
        },
        header: {
          borderBottom: '1px solid #E5E7EB',
          paddingBottom: '1rem',
          marginBottom: '1rem',
        }
      }
    }),
    TextInput: TextInput.extend({ defaultProps: { radius: 'md' } }),
    Select: Select.extend({ defaultProps: { radius: 'md' } }),
    PasswordInput: PasswordInput.extend({ defaultProps: { radius: 'md' } }),
    NumberInput: NumberInput.extend({ defaultProps: { radius: 'md' } }),
    Textarea: Textarea.extend({ defaultProps: { radius: 'md' } }),
    Table: Table.extend({
      defaultProps: {
        striped: false,
        highlightOnHover: true,
        verticalSpacing: 'md',
      },
      styles: {
        th: {
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#6B7280',
          letterSpacing: '0.05em',
          borderBottom: '1px solid #E5E7EB',
        },
        td: {
          borderBottom: '1px solid #F3F4F6',
          fontSize: '0.875rem',
          color: '#374151',
        },
        tr: {
          transition: 'background-color 0.15s ease',
        }
      }
    }),
    Badge: Badge.extend({
      defaultProps: {
        radius: 'sm',
        fw: 600,
      }
    }),
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <MantineProvider theme={theme}>
          <App />
        </MantineProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
