import * as pulumi from "@pulumi/pulumi";
import * as azure from "@pulumi/azure";

const config = new pulumi.Config();

const mainResourceGroup = new azure.core.ResourceGroup("dougdeleteme", {
    location: "North Europe",
});
const mainVirtualNetwork = new azure.network.VirtualNetwork("main", {
    addressSpaces: ["10.0.0.0/16"],
    location: mainResourceGroup.location,
    resourceGroupName: mainResourceGroup.name,
});

 const internal = new azure.network.Subnet("internal", {
     addressPrefix: "10.0.2.0/24",
     resourceGroupName: mainResourceGroup.name,
     virtualNetworkName: mainVirtualNetwork.name,
 });

 createNode("master", "10.0.2.4");
 createNode("node1", "10.0.2.5");
 createNode("util", "10.0.2.6");


  function createNode(nodeName: string, privateIp: string) : void {
    const nsg = new azure.network.NetworkSecurityGroup(nodeName, {
        location: mainResourceGroup.location,
        name: nodeName,
        resourceGroupName: mainResourceGroup.name,
        securityRules: [{
            access: "Allow",
            destinationAddressPrefix: "*",
            destinationPortRange: "22",
            direction: "Inbound",
            name: "SSH",
            priority: 300,
            protocol: "Tcp",
            sourceAddressPrefix: "*",
            sourcePortRange: "*",
        }]
    });
    
    const publicIp = new azure.network.PublicIp(nodeName, {
        location: mainResourceGroup.location,
        allocationMethod: "Dynamic",
        resourceGroupName: mainResourceGroup.name,
        name: nodeName
    })
    
    const mainNetworkInterface = new azure.network.NetworkInterface(nodeName, {
        ipConfigurations: [{
            name: "testconfiguration1",
            privateIpAddressAllocation: "Static",
            privateIpAddress: privateIp,
            subnetId: internal.id,
            publicIpAddressId: publicIp.id
        }],
        networkSecurityGroupId: nsg.id,
        location: mainResourceGroup.location,
        resourceGroupName: mainResourceGroup.name,
    });
    
    const masterVm = new azure.compute.VirtualMachine(nodeName, {
        location: mainResourceGroup.location,
        networkInterfaceIds: [mainNetworkInterface.id],
        osProfile: {
            adminPassword: "Sdm4Ever!",
            adminUsername: "doug",
            computerName: nodeName,
        },
        osProfileLinuxConfig: {
            disablePasswordAuthentication: false,
        },
        
        resourceGroupName: mainResourceGroup.name,
        storageImageReference: {
            offer: "UbuntuServer",
            publisher: "Canonical",
            sku: "18.04-LTS",
            version: "latest",
        },
        storageOsDisk: {
            caching: "ReadWrite",
            createOption: "FromImage",
            managedDiskType: "Standard_LRS",
            name: nodeName,
        },
        tags: {
            environment: "doug-testing",
        },
        vmSize: "Standard_DS2_v2",
    });

  }

 