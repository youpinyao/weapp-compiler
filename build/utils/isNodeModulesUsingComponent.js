const nodeModulesUsingComponent = [];

function isNodeModulesUsingComponent(name) {
  return nodeModulesUsingComponent.indexOf(name.replace(/\.(js|wxml|wxss|json|wxs)$/g, '')) !== -1;
}

function addNodeModulesUsingComponent(item) {
  nodeModulesUsingComponent.push(item);
}

module.exports = {
  isNodeModulesUsingComponent,
  addNodeModulesUsingComponent,
};
