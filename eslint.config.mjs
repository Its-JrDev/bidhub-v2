import nextConfig from 'eslint-config-next';
import prettier from 'eslint-config-prettier';

const eslintConfig = [...nextConfig, prettier];

export default eslintConfig;
