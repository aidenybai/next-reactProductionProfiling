import withMillionLint from '@million/lint';

/** @type {import('next').NextConfig} */
const nextConfig = {};

export default withMillionLint.next({ rsc: true })(nextConfig);
