import ts from 'typescript'

function walk(node, visit) {
  visit(node)
  node.forEachChild((child) => walk(child, visit))
}

function hasModifier(node, kind) {
  return node.modifiers?.some((modifier) => modifier.kind === kind) ?? false
}

function propertyName(node) {
  if (
    ts.isIdentifier(node) ||
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node)
  ) {
    return node.text
  }
  return undefined
}

function callOn(node, owner, method) {
  return (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === owner &&
    node.expression.name.text === method
  )
}

function contains(root, predicate) {
  let found = false
  walk(root, (node) => {
    if (!found && predicate(node)) found = true
  })
  return found
}

function count(root, predicate) {
  let matches = 0
  walk(root, (node) => {
    if (predicate(node)) matches += 1
  })
  return matches
}

function envKeys(sourceFile) {
  const keys = new Set()
  walk(sourceFile, (node) => {
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      ts.isIdentifier(node.expression.expression) &&
      node.expression.expression.text === 'process' &&
      node.expression.name.text === 'env'
    ) {
      keys.add(node.name.text)
    }
  })
  return keys
}

function bindingLocalName(pattern, requestedName) {
  if (!ts.isObjectBindingPattern(pattern)) return undefined
  const element = pattern.elements.find((candidate) => {
    const boundProperty = candidate.propertyName
      ? propertyName(candidate.propertyName)
      : propertyName(candidate.name)
    return boundProperty === requestedName
  })
  return element && ts.isIdentifier(element.name)
    ? element.name.text
    : undefined
}

function findPlaywrightBaseName(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@playwright/test'
    ) {
      continue
    }
    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    const testImport = bindings.elements.find(
      (element) => (element.propertyName?.text ?? element.name.text) === 'test',
    )
    if (testImport) return testImport.name.text
  }
  return undefined
}

function findExportedTestExtension(sourceFile, baseName) {
  for (const statement of sourceFile.statements) {
    if (
      !ts.isVariableStatement(statement) ||
      !hasModifier(statement, ts.SyntaxKind.ExportKeyword)
    ) {
      continue
    }
    for (const declaration of statement.declarationList.declarations) {
      if (
        !ts.isIdentifier(declaration.name) ||
        declaration.name.text !== 'test' ||
        !declaration.initializer ||
        !ts.isCallExpression(declaration.initializer) ||
        !ts.isPropertyAccessExpression(declaration.initializer.expression) ||
        !ts.isIdentifier(declaration.initializer.expression.expression) ||
        declaration.initializer.expression.expression.text !== baseName ||
        declaration.initializer.expression.name.text !== 'extend'
      ) {
        continue
      }
      const fixtures = declaration.initializer.arguments[0]
      if (fixtures && ts.isObjectLiteralExpression(fixtures)) return fixtures
    }
  }
  return undefined
}

function findAutoGuardFixture(fixtures) {
  for (const property of fixtures.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      !ts.isArrayLiteralExpression(property.initializer)
    ) {
      continue
    }
    const [setup, options] = property.initializer.elements
    if (
      (!ts.isArrowFunction(setup) && !ts.isFunctionExpression(setup)) ||
      !options ||
      !ts.isObjectLiteralExpression(options)
    ) {
      continue
    }
    const auto = options.properties.find(
      (candidate) =>
        ts.isPropertyAssignment(candidate) &&
        propertyName(candidate.name) === 'auto' &&
        candidate.initializer.kind === ts.SyntaxKind.TrueKeyword,
    )
    const contextName = setup.parameters[0]
      ? bindingLocalName(setup.parameters[0].name, 'context')
      : undefined
    const useName =
      setup.parameters[1] && ts.isIdentifier(setup.parameters[1].name)
        ? setup.parameters[1].name.text
        : undefined
    if (auto && contextName && useName) {
      return { setup, contextName, useName }
    }
  }
  return undefined
}

function validateGuardHandler(handler, routeName, errors) {
  let requestName
  walk(handler.body, (node) => {
    if (
      !requestName &&
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      callOn(node.initializer, routeName, 'request')
    ) {
      requestName = node.name.text
    }
  })

  if (!requestName) {
    errors.push('fixture guard는 route.request()에서 요청을 읽어야 함')
    return
  }
  if (!contains(handler.body, (node) => callOn(node, routeName, 'continue'))) {
    errors.push('fixture guard는 허용된 요청만 route.continue() 해야 함')
  }
  if (
    contains(
      handler.body,
      (node) =>
        callOn(node, routeName, 'fulfill') || callOn(node, routeName, 'abort'),
    )
  ) {
    errors.push('fixture guard에서 route.fulfill()/abort() 사용 금지')
  }
  if (!contains(handler.body, (node) => callOn(node, requestName, 'url'))) {
    errors.push('fixture guard는 request.url()을 검사해야 함')
  }
  if (!contains(handler.body, (node) => callOn(node, requestName, 'method'))) {
    errors.push('fixture guard는 request.method()를 검사해야 함')
  }
  for (const requiredProperty of ['origin', 'pathname']) {
    if (
      !contains(
        handler.body,
        (node) =>
          ts.isPropertyAccessExpression(node) &&
          node.name.text === requiredProperty,
      )
    ) {
      errors.push(`fixture guard는 요청 ${requiredProperty}을 검사해야 함`)
    }
  }
  if (
    !contains(
      handler.body,
      (node) =>
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'has',
    )
  ) {
    errors.push('fixture guard는 승인 method 집합을 검사해야 함')
  }
  if (count(handler.body, (node) => ts.isThrowStatement(node)) < 3) {
    errors.push(
      'fixture guard는 origin, base path, method 위반을 각각 차단해야 함',
    )
  }
}

export function validateRealFixtureSource(source) {
  const sourceFile = ts.createSourceFile(
    'real-api-fixture.ts',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const errors = sourceFile.parseDiagnostics.map(
    (diagnostic) =>
      `fixture TypeScript 구문 오류: ${ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        '\n',
      )}`,
  )
  const baseName = findPlaywrightBaseName(sourceFile)
  if (!baseName) {
    errors.push('fixture는 @playwright/test의 test를 base로 import해야 함')
    return errors
  }
  const fixtures = findExportedTestExtension(sourceFile, baseName)
  if (!fixtures) {
    errors.push('fixture는 Playwright test.extend(...) 결과를 export해야 함')
    return errors
  }
  const guard = findAutoGuardFixture(fixtures)
  if (!guard) {
    errors.push('fixture는 context를 받는 auto network guard fixture여야 함')
    return errors
  }
  if (
    !contains(guard.setup.body, (node) => {
      if (
        !ts.isCallExpression(node) ||
        !ts.isIdentifier(node.expression) ||
        node.expression.text !== guard.useName
      ) {
        return false
      }
      return node.parent && ts.isAwaitExpression(node.parent)
    })
  ) {
    errors.push('auto network guard fixture는 await use()를 호출해야 함')
  }

  let routeHandler
  walk(guard.setup.body, (node) => {
    if (
      routeHandler ||
      !callOn(node, guard.contextName, 'route') ||
      node.arguments.length < 2
    ) {
      return
    }
    const [pattern, handler] = node.arguments
    if (
      ts.isStringLiteral(pattern) &&
      pattern.text === '**/*' &&
      (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler))
    ) {
      routeHandler = handler
    }
  })
  if (!routeHandler) {
    errors.push(
      "auto network guard fixture는 context.route('**/*', ...)를 설치해야 함",
    )
    return errors
  }
  const routeParameter = routeHandler.parameters[0]?.name
  if (!routeParameter || !ts.isIdentifier(routeParameter)) {
    errors.push('context.route handler는 route 인자를 받아야 함')
    return errors
  }

  const requiredEnvKeys = [
    'VITE_API_BASE_URL',
    'API_E2E_ALLOWED_METHODS',
    'PLAYWRIGHT_BASE_URL',
  ]
  const usedEnvKeys = envKeys(sourceFile)
  for (const key of requiredEnvKeys) {
    if (!usedEnvKeys.has(key)) {
      errors.push(`fixture guard는 process.env.${key}를 사용해야 함`)
    }
  }
  validateGuardHandler(routeHandler, routeParameter.text, errors)
  return errors
}

export function validateRealTestSource(source) {
  const errors = []
  if (!/from\s+['"]\.\/real-api-fixture['"]/.test(source)) {
    errors.push('실제 서버 테스트는 real-api-fixture를 사용해야 함')
  }
  if (/\b(?:page|context)\.route\s*\(/.test(source)) {
    errors.push('실제 서버 테스트에서 page/context route mock 사용 금지')
  }
  if (/\broute\.fulfill\s*\(/.test(source)) {
    errors.push('실제 서버 테스트에서 mock 응답 사용 금지')
  }
  return errors
}
