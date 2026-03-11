import 'reflect-metadata';
import {
  Resource,
  Col,
  Deny,
  Readonly,
  Hidden,
  Searchable,
  Ignore,
  AdminOnly,
  Rule,
  getResourceMeta,
  getFieldsMeta,
} from '../../src';

describe('@Resource decorator', () => {
  it('sets default operations and pagination', () => {
    @Resource('user')
    class User {}

    const meta = getResourceMeta(User);
    expect(meta).toBeDefined();
    expect(meta!.name).toBe('user');
    expect(meta!.operations).toEqual(['create', 'list', 'get', 'update', 'remove']);
    expect(meta!.pagination).toEqual({ max: 100 });
  });

  it('respects custom operations', () => {
    @Resource('post', { operations: ['list', 'get'] })
    class Post {}

    const meta = getResourceMeta(Post);
    expect(meta!.operations).toEqual(['list', 'get']);
  });

  it('includes fields from property decorators', () => {
    @Resource('article')
    class Article {
      @Col({ label: 'Title' })
      title!: string;
    }

    const meta = getResourceMeta(Article);
    expect(meta!.fields['title']).toBeDefined();
    expect(meta!.fields['title'].label).toBe('Title');
  });
});

describe('@Col decorator', () => {
  it('stores field metadata with type info', () => {
    class Entity {
      @Col({ label: 'Name' })
      name!: string;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['name']).toBeDefined();
    expect(fields['name'].key).toBe('name');
    expect(fields['name'].label).toBe('Name');
  });

  it('handles multiple fields', () => {
    class Entity {
      @Col({ label: 'A' })
      a!: string;

      @Col({ label: 'B' })
      b!: number;
    }

    const fields = getFieldsMeta(Entity);
    expect(Object.keys(fields)).toHaveLength(2);
    expect(fields['a'].label).toBe('A');
    expect(fields['b'].label).toBe('B');
  });

  it('stores UI and list options', () => {
    class Entity {
      @Col({
        label: 'Email',
        ui: { widget: 'email', placeholder: 'Enter email' },
        list: { sortable: true, filterable: true },
      })
      email!: string;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['email'].ui!.widget).toBe('email');
    expect(fields['email'].list!.sortable).toBe(true);
  });
});

describe('@Deny decorator', () => {
  it('marks field as denied for specified operations', () => {
    class Entity {
      @Deny('create', 'update')
      id!: number;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['id'].deny).toEqual(['create', 'update']);
  });
});

describe('@Readonly decorator', () => {
  it('denies create and update', () => {
    class Entity {
      @Readonly()
      createdAt!: Date;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['createdAt'].deny).toContain('create');
    expect(fields['createdAt'].deny).toContain('update');
  });
});

describe('@Hidden decorator', () => {
  it('hides field from specified views', () => {
    class Entity {
      @Hidden('list')
      secret!: string;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['secret'].hidden).toEqual(['list']);
  });

  it('supports multiple views', () => {
    class Entity {
      @Hidden('list', 'get')
      internal!: string;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['internal'].hidden).toEqual(['list', 'get']);
  });
});

describe('@Searchable decorator', () => {
  it('marks field as searchable', () => {
    class Entity {
      @Searchable()
      title!: string;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['title'].searchable).toBe(true);
  });
});

describe('@Ignore decorator', () => {
  it('marks field as ignored', () => {
    class Entity {
      @Ignore()
      temp!: string;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['temp'].ignore).toBe(true);
  });
});

describe('@AdminOnly decorator', () => {
  it('sets adminOnly operations', () => {
    class Entity {
      @AdminOnly('update', 'remove')
      role!: string;
    }

    const fields = getFieldsMeta(Entity);
    expect((fields['role'] as any).adminOnly).toEqual(['update', 'remove']);
  });
});

describe('@Rule decorators stored in field meta', () => {
  it('attaches rules via @Col + @Rule', () => {
    class Entity {
      @Col({ label: 'Email' })
      @Rule.required()
      @Rule.email()
      email!: string;
    }

    const fields = getFieldsMeta(Entity);
    expect(fields['email'].rules).toHaveLength(2);
    expect(fields['email'].rules![0].kind).toBe('email');
    expect(fields['email'].rules![1].kind).toBe('required');
  });
});

describe('getResourceMeta / getFieldsMeta', () => {
  it('returns undefined for undecorated class', () => {
    class Plain {}
    expect(getResourceMeta(Plain)).toBeUndefined();
  });

  it('returns empty fields for undecorated class', () => {
    class Plain {}
    expect(getFieldsMeta(Plain)).toEqual({});
  });
});
