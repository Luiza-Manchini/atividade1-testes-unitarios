import { isUniqueViolation } from '../../src/database/unique-violation';

describe('isUniqueViolation', () => {
  test('reconhece o SQLSTATE 23505 na propriedade code de um objeto', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  test.each([null, undefined, '23505', 23503, {}, { code: 'outro' }])(
    'nao reconhece a entrada %p como violacao de unicidade',
    (value) => {
      expect(isUniqueViolation(value)).toBe(false);
    },
  );
});
