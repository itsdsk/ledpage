import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import {
	terser
} from 'rollup-plugin-terser';
import css from 'rollup-plugin-css-only';

const production = !process.env.ROLLUP_WATCH;

let indexconfig = {
	input: 'views/compile_index.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: '../public/index-bundle.js'
	},
	plugins: [
		svelte({
			onwarn: (warning, handler) => {
				// don't warn on socketio because it is constructed in HTML
				if (warning.message === "'socket' is not defined") return;
				// let Rollup handle all other warnings normally
				handler(warning);
			},
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),

		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({
			output: 'index-bundle.css'
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('../public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

let setupconfig = {
	input: 'views/compile_setup.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: '../public/setup-bundle.js'
	},
	plugins: [
		svelte({
			onwarn: (warning, handler) => {
				// don't warn on socketio because it is constructed in HTML
				if (warning.message === "'socket' is not defined") return;
				// let Rollup handle all other warnings normally
				handler(warning);
			},
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),

		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({
			output: 'setup-bundle.css'
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('../public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};

var to_export = process.env.INDEX ? indexconfig :
	process.env.SETUP ? setupconfig : [indexconfig, setupconfig];

export default to_export;

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}