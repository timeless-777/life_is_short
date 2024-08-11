// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
contract LifeIsShort is ERC721, ERC721URIStorage, ERC721Burnable, Ownable {
    using Strings for uint256;
    uint256 private _nextTokenId;

    constructor(
        address initialOwner
    ) ERC721("LifeIsShort", "LIS") Ownable(initialOwner) {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://res.cloudinary.com/dxqgqsi0r/life/answer-";
    }

    function safeMint(address to, string memory uri) public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        // トークンURIを取得
        string memory baseURI = super.tokenURI(tokenId);

        // JSONデータを構築して返す
        return
            string(
                abi.encodePacked(
                    '{"name": "Token #',
                    Strings.toString(tokenId),
                    '", ',
                    '"description": "This is token #',
                    Strings.toString(tokenId),
                    '", ',
                    '"image": "',
                    baseURI,
                    '"}'
                )
            );
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
