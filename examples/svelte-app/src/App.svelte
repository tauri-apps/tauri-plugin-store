<script lang="ts">
	import { Store } from 'tauri-plugin-store-api'

	const key = 'the-key'
	const store = new Store('.settings')

	let response = '';
	let record;

	function _updateResponse(returnValue) {
		response += (typeof returnValue === 'string' ? returnValue : JSON.stringify(returnValue)) + '<br>'
	}

	function set() {
		store.set(key, record).catch(_updateResponse)
	}

	function get() {
		store.get(key)
			.then(_updateResponse)
			.catch(_updateResponse)
	}

	function set_broken() {
		const brokenStore = new Store('broken')
		brokenStore.set('foo', 'bar')
	}
</script>

<style>
	html {
		background: #fff;
	}
</style>
<div>
	<button on:click="{set_broken}">Broken</button>
</div>
<div>
	<input placeholder="The value to store" bind:value={record}>
	<button on:click="{set}">Set</button>
</div>
<div>
	<button on:click="{get}">Get</button>
	<div>{@html response}</div>
</div>
