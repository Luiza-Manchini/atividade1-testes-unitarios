import { isForeignKeyViolation } from '../../src/database/foreign-key-violation';

describe('isForeignKeyViolation', () => {
  test('reconhece o SQLSTATE 23503 na propriedade code de um objeto', () => {
    expect(isForeignKeyViolation({ code: '23503' })).toBe(true);
  });

  test.each([null, undefined, '23505', 23503, {}, { code: 'outro' }])(
    'nao reconhece a entrada %p como violacao de chave estrangeira',
    (value) => {
      expect(isForeignKeyViolation(value)).toBe(false);
    },
  );
});
