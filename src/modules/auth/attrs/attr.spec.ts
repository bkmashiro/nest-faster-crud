import { matchAttributes } from './attr.guards'

const testRootUser = {
  root: true,
  main: {
    sub1: {
      sub2: true
    },
    sub3: true
  },
  soc: {
    manage:{
      s1: true,
      s2: false
    }
  }
}

const testNormalUser = {
  main: {
    sub1: {
      sub2: true
    },
    sub3: false,
    sub6: true
  },
  soc: {
    manage:{
      s1: true,
      s2: false
    }
  }
}

const testNormalUser2= {
  main:true
}

test('only root can access',  () => {
  expect(matchAttributes(['root'], testRootUser)).toBe(true)
})

test('root access any',  () => {
  expect(matchAttributes(['root', 'main', 'not.exist'], testRootUser)).toBe(true)
})

test('normal user access leaf node which is granted',  () => {
  expect(matchAttributes(['main.sub3'], testNormalUser)).toBe(false)
})

test('normal user access leaf node which is not granted',  () => {
  expect(matchAttributes(['main.sub3'], testNormalUser)).toBe(false)
})

test('normal user access leaf node which is granted',  () => {
  expect(matchAttributes(['main.sub1.sub2'], testNormalUser)).toBe(true)
})

test('normal user access leaf node which is not exist',  () => {
  expect(matchAttributes(['main.sub1.sub114514'], testNormalUser)).toBe(false)
})

test('normal user access inner node',  () => {
  expect(matchAttributes(['main.sub1.sub2.sub4'], testNormalUser2)).toBe(true)
})