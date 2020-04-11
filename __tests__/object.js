const { isNotValidWithErrors, isValidWithoutErrors } = require('./_util');
const v = require('../src/index');

describe('object', () => {

  describe('type', () => {
    it('should pass with object', () => {
      let result = v.validateSync(v.object({}), {});

      isValidWithoutErrors(result);
    });

    it('should pass with plain object not wrapped in v.object()', () => {
      let result = v.validateSync({}, {});

      isValidWithoutErrors(result);
    });

    it('should pass with plain object not wrapped in v.object() async validate', async () => {
      let result = await v.validate({}, {});

      isValidWithoutErrors(result);
    });

    it('should fail with number', () => {
      let result = v.validateSync(v.object(1), 1);

      isNotValidWithErrors(result);
    });
  });

  describe('cast', () => {
    it('should cast all nested keys validation', () => {
      const value = {
        isActive: 'true',
        num: '123',
      };
      const schema = v.object({
        isActive: v.boolean().required(),
        num: v.number().max(999).required(),
      }).cast();
      const result = schema.validateSync(value);

      isValidWithoutErrors(result);
      expect(result.value).toEqual({ isActive: true, num: 123 });
    });

    it('should cast all nested level 2 keys validation', () => {
      const value = {
        isActive: 'true',
        num: '123',
        data: {
          id: '5',
        }
      };
      const schema = v.object({
        isActive: v.boolean().required(),
        num: v.number().max(999).required(),
        data: v.object({
          id: v.number().required(),
        }),
      }).cast();
      const result = schema.validateSync(value);

      isValidWithoutErrors(result);
      const expectedValue = {
        isActive: true,
        num: 123,
        data: { id: 5 },
      };
      expect(result.value).toEqual(expectedValue);
    });

    it('should cast the keys that needs to', () => {
      const value = {
        username: 'john',
        email: 'john.doe@g.co',
        password: 'pwd123',
        age: '32',
      };

      const schema = v.object({
        username: v.string().min(3).max(30).required(),
        email: v.string().min(5).max(255).required().email(),
        password: v.string().min(5).max(255).required(),
        age: v.number().cast().min(0).max(200),
      });

      const result = schema.validateSync(value);

      isValidWithoutErrors(result);
      const expectedValue = {
        ...value,
        age: 32,
      };
      expect(result.value).toEqual(expectedValue);
    });
  });

  describe('keys validation', () => {
    it('should validate an object with keys', () => {
      const value = {
        foo: 'bar',
      };
      const schema = v.object({
        'foo': v.string().required(),
      });
      const result = schema.validateSync(value);

      isValidWithoutErrors(result);
    });

    it('should validate an object with keys is not valid', () => {
      const value = {
        foo: 1,
      };
      const schema = v.object({
        'foo': v.string().required(),
      });
      const result = schema.validateSync(value);

      isNotValidWithErrors(result);
    });
  });

  describe('sync validate vs async validate', () => {
    it('should return the same result from async validate vs. sync validte', () => {
      const data = {
        a: 6,
      };
      const schema = v.object({
        a: v.number().min(6).required(),
      });
      const resultSync = schema.validateSync(data);

      return schema.validate(data).then((resultAsync) => {
        expect(resultAsync).toEqual(resultSync);
      });
    });
  });

  describe('reported issues', () => {
    // @link https://github.com/vlucas/vlid/issues/6
    it('issue #6 - should support ref regardless of key order', () => {
      const data = {
        a: 6,
      };

      const result1 = v.object({
        a: v.number().min(v.ref('b')).required(),
        b: v.number().default(5),
      }).validate(data);

      const result2 = v.object({
        b: v.number().default(5),
        a: v.number().min(v.ref('b')).required(),
      }).validate(data);

      return Promise.all([result1, result2])
        .then(([result1, result2]) => {
          expect(result1).toEqual(result2);
          isValidWithoutErrors(result1);
          isValidWithoutErrors(result2);
        });
    });
  });

});
