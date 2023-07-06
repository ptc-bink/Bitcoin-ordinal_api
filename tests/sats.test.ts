import { buildApiServer } from '../src/api/init';
import { cycleMigrations } from '../src/pg/migrations';
import { PgStore } from '../src/pg/pg-store';
import { TestChainhookPayloadBuilder, TestFastifyServer } from './helpers';

describe('/sats', () => {
  let db: PgStore;
  let fastify: TestFastifyServer;

  beforeEach(async () => {
    db = await PgStore.connect({ skipMigrations: true });
    fastify = await buildApiServer({ db });
    await cycleMigrations();
  });

  afterEach(async () => {
    await fastify.close();
    await db.close();
  });

  test('returns valid sat', async () => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/ordinals/v1/sats/10080000000001',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toStrictEqual({
      coinbase_height: 2016,
      cycle: 0,
      decimal: '2016.1',
      degree: '0°2016′0″1‴',
      epoch: 0,
      name: 'ntwwidfrzxg',
      offset: 1,
      percentile: '0.48000000052804787%',
      period: 1,
      rarity: 'common',
    });
  });

  test('returns sat with inscription', async () => {
    await db.updateInscriptions(
      new TestChainhookPayloadBuilder()
        .apply()
        .block({ height: 775617 })
        .transaction({ hash: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dc' })
        .inscriptionRevealed({
          content_bytes: '0x48656C6C6F',
          content_type: 'image/png',
          content_length: 5,
          inscription_number: 7,
          inscription_fee: 2805,
          inscription_id: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dci0',
          inscription_output_value: 10000,
          inscriber_address: 'bc1p3cyx5e2hgh53w7kpxcvm8s4kkega9gv5wfw7c4qxsvxl0u8x834qf0u2td',
          ordinal_number: 257418248345364,
          ordinal_block_height: 650000,
          ordinal_offset: 0,
          satpoint_post_inscription:
            '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dc:0:0',
        })
        .build()
    );
    const response = await fastify.inject({
      method: 'GET',
      url: '/ordinals/v1/sats/257418248345364',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json().inscription_id).toBe(
      '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dci0'
    );
  });

  test('returns sat with more than 1 cursed inscription', async () => {
    await db.updateInscriptions(
      new TestChainhookPayloadBuilder()
        .apply()
        .block({ height: 775617 })
        .transaction({ hash: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dc' })
        .cursedInscriptionRevealed({
          content_bytes: '0x48656C6C6F',
          content_type: 'image/png',
          content_length: 5,
          inscription_number: -7,
          inscription_fee: 2805,
          inscription_id: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dci0',
          inscription_output_value: 10000,
          inscriber_address: 'bc1p3cyx5e2hgh53w7kpxcvm8s4kkega9gv5wfw7c4qxsvxl0u8x834qf0u2td',
          ordinal_number: 257418248345364,
          ordinal_block_height: 650000,
          ordinal_offset: 0,
          satpoint_post_inscription:
            '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dc:0:0',
          curse_type: 'p2wsh',
        })
        .build()
    );
    await db.updateInscriptions(
      new TestChainhookPayloadBuilder()
        .apply()
        .block({
          height: 775617,
          hash: '000000000000000000002a244dc7dfcf8ab85e42d182531c27197fc125086f19',
          timestamp: 1676913207,
        })
        .transaction({
          hash: 'b9cd9489fe30b81d007f753663d12766f1368721a87f4c69056c8215caa57993',
        })
        .cursedInscriptionRevealed({
          content_bytes: '0x48656C6C6F',
          content_type: 'image/png',
          content_length: 5,
          inscription_number: -1,
          inscription_fee: 2805,
          inscription_id: 'b9cd9489fe30b81d007f753663d12766f1368721a87f4c69056c8215caa57993i0',
          inscription_output_value: 10000,
          inscriber_address: 'bc1p3cyx5e2hgh53w7kpxcvm8s4kkega9gv5wfw7c4qxsvxl0u8x834qf0u2td',
          ordinal_number: 257418248345364,
          ordinal_block_height: 650000,
          ordinal_offset: 0,
          satpoint_post_inscription:
            'b9cd9489fe30b81d007f753663d12766f1368721a87f4c69056c8215caa57993:0:0',
          curse_type: 'p2wsh',
        })
        .build()
    );
    const response = await fastify.inject({
      method: 'GET',
      url: '/ordinals/v1/sats/257418248345364/inscriptions',
    });
    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json.total).toBe(2);
    expect(json.results).toStrictEqual([
      {
        address: 'bc1p3cyx5e2hgh53w7kpxcvm8s4kkega9gv5wfw7c4qxsvxl0u8x834qf0u2td',
        content_length: 5,
        content_type: 'image/png',
        genesis_address: 'bc1p3cyx5e2hgh53w7kpxcvm8s4kkega9gv5wfw7c4qxsvxl0u8x834qf0u2td',
        genesis_block_hash: '163de66dc9c0949905bfe8e148bde04600223cf88d19f26fdbeba1d6e6fa0f88',
        genesis_block_height: 775617,
        genesis_fee: '2805',
        genesis_timestamp: 1677803510000,
        genesis_tx_id: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dc',
        id: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dci0',
        location: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dc:0:0',
        mime_type: 'image/png',
        number: -7,
        offset: '0',
        output: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dc:0',
        sat_coinbase_height: 51483,
        sat_ordinal: '257418248345364',
        sat_rarity: 'common',
        timestamp: 1677803510000,
        tx_id: '38c46a8bf7ec90bc7f6b797e7dc84baa97f4e5fd4286b92fe1b50176d03b18dc',
        value: '10000',
        curse_type: '"p2wsh"',
      },
      {
        address: 'bc1p3cyx5e2hgh53w7kpxcvm8s4kkega9gv5wfw7c4qxsvxl0u8x834qf0u2td',
        content_length: 5,
        content_type: 'image/png',
        genesis_address: 'bc1p3cyx5e2hgh53w7kpxcvm8s4kkega9gv5wfw7c4qxsvxl0u8x834qf0u2td',
        genesis_block_hash: '000000000000000000002a244dc7dfcf8ab85e42d182531c27197fc125086f19',
        genesis_block_height: 775617,
        genesis_fee: '2805',
        genesis_timestamp: 1676913207000,
        genesis_tx_id: 'b9cd9489fe30b81d007f753663d12766f1368721a87f4c69056c8215caa57993',
        id: 'b9cd9489fe30b81d007f753663d12766f1368721a87f4c69056c8215caa57993i0',
        location: 'b9cd9489fe30b81d007f753663d12766f1368721a87f4c69056c8215caa57993:0:0',
        mime_type: 'image/png',
        number: -1,
        offset: '0',
        output: 'b9cd9489fe30b81d007f753663d12766f1368721a87f4c69056c8215caa57993:0',
        sat_coinbase_height: 51483,
        sat_ordinal: '257418248345364',
        sat_rarity: 'common',
        timestamp: 1676913207000,
        tx_id: 'b9cd9489fe30b81d007f753663d12766f1368721a87f4c69056c8215caa57993',
        value: '10000',
        curse_type: '"p2wsh"',
      },
    ]);
  });

  test('returns not found on invalid sats', async () => {
    const response1 = await fastify.inject({
      method: 'GET',
      url: '/ordinals/v1/sats/2099999997690000',
    });
    expect(response1.statusCode).toBe(400);

    const response2 = await fastify.inject({
      method: 'GET',
      url: '/ordinals/v1/sats/-1',
    });
    expect(response2.statusCode).toBe(400);
  });
});
