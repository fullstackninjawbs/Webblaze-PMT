import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { MantineProvider, createTheme } from '@mantine/core';
import { store } from './app/store';
import App from './App';
import '@mantine/core/styles.css';
import './index.css';

const theme = createTheme({
  primaryColor: 'orange',
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMonospace: "'JetBrains Mono', 'Fira Code', monospace",
  defaultRadius: 'md',

  headings: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2rem', fontWeight: '800', lineHeight: '1.2' },
      h2: { fontSize: '1.625rem', fontWeight: '700', lineHeight: '1.25' },
      h3: { fontSize: '1.25rem', fontWeight: '600', lineHeight: '1.3' },
      h4: { fontSize: '1.125rem', fontWeight: '600', lineHeight: '1.35' },
      h5: { fontSize: '0.9375rem', fontWeight: '600', lineHeight: '1.4' },
      h6: { fontSize: '0.875rem', fontWeight: '600', lineHeight: '1.4' },
    },
  },

  fontSizes: {
    xs: '0.8125rem',
    sm: '0.875rem',
    md: '0.9375rem',
    lg: '1.0625rem',
    xl: '1.25rem',
  },

  lineHeights: {
    xs: '1.4',
    sm: '1.5',
    md: '1.55',
    lg: '1.6',
    xl: '1.65',
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
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'sm',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
      },
    },
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
